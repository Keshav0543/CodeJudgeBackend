import Contest from "../models/contest.js";
import Contestparticipant from "../models/contestParticipant.js";
import transporter from "../config/transPorter.js";


async function calculateRatting() {
  try {
    // --------------------------------
    // Find expired contest
    // --------------------------------

    const result = await Contest.findOne({
      status: "Expired",
      ratingCalculated: false,
    });

    if (!result) {
      throw new Error("Contest is not found. Something went wrong...");
    }

    // --------------------------------
    // Get all participants
    // --------------------------------

    const participants = await Contestparticipant.find({
      contest_id: result._id,
      status: "finished",
    }).populate("user_id", "rating emailId firstName");

    if (participants.length === 0) {
      throw new Error("No one participated in contest...");
    }

    const K = 32;
    const N = participants.length;

    // --------------------------------
    // PHASE 1
    // Store old ratings
    // --------------------------------

    for (let data of participants) {
      data.ratingBefore = data.user_id.rating;
    }

    // --------------------------------
    // PHASE 2
    // Calculate rating changes
    // --------------------------------

    if (N > 1) {
      for (let data of participants) {
        let totalDifference = 0;

        for (let opponent of participants) {
          // Don't compare user with himself
          if (data.user_id._id.equals(opponent.user_id._id)) {
            continue;
          }

          const ratingA = data.ratingBefore;
          const ratingB = opponent.ratingBefore;

          // Expected score
          const expectedScore =
            1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));

          // Actual score
          let actualScore;

          if (data.score > opponent.score) {
            actualScore = 1;
          } else if (data.score < opponent.score) {
            actualScore = 0;
          } else {
            actualScore = 0.5;
          }

          totalDifference += actualScore - expectedScore;
        }

        // Rating change
        const ratingChange =
          (K / (N - 1)) * totalDifference;

        data.ratingChange = Math.round(ratingChange);

        // Rating after contest
        data.ratingAfter =
          data.ratingBefore + data.ratingChange;
      }
    } else {
      // Only one participant
      const data = participants[0];

      data.ratingChange = 0;
      data.ratingAfter = data.ratingBefore;
    }

    // --------------------------------
    // PHASE 3
    // Save participant rating
    // and update global User rating
    // --------------------------------

    for (let data of participants) {
      await data.save();

      data.user_id.rating = data.ratingAfter;

      await data.user_id.save();
    }

    // --------------------------------
    // PHASE 4
    // Promote Top 80
    // Only for Saturday contest
    // --------------------------------

    if (result.type === "saturday") {
      // Find corresponding Sunday contest
      const sundayContest = await Contest.findById(result.qualifier);

      if (!sundayContest) {
        throw new Error(
          "Sunday qualifier contest not found..."
        );
      }

      // Find Top 80 by ratingAfter
      const Top80 = await Contestparticipant.find({
        contest_id: result._id,
        status: "finished",
      })
        .sort({ ratingAfter: -1 })
        .limit(80)
        .populate("user_id", "emailId firstName");

      // --------------------------------
      // Create Sunday participants
      // --------------------------------

      for (let data of Top80) {
        // Check if already admitted
        const alreadyAdmitted =
          await Contestparticipant.findOne({
            contest_id: sundayContest._id,
            user_id: data.user_id._id,
          });

        if (alreadyAdmitted) {
          continue;
        }

        // Create Sunday participant
        await Contestparticipant.create({
          contest_id: sundayContest._id,
          user_id: data.user_id._id,
          status: "registered",
          admittedFromContest: result._id,
        });

        // --------------------------------
        // Send promotion email
        // --------------------------------

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: data.user_id.emailId,
          subject: `Congratulations ${data.user_id.firstName}! You Qualified for Sunday Contest`,
          html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sunday Contest Qualification</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#0d1117;
  font-family:'JetBrains Mono','Courier New',monospace;
">

<table role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="background-color:#0d1117;padding:40px 0;">

  <tr>
    <td align="center">

      <table role="presentation"
        width="480"
        cellpadding="0"
        cellspacing="0"
        style="
          background-color:#161b22;
          border:1px solid #30363d;
          border-radius:10px;
          overflow:hidden;
        ">

        <!-- Accent -->
        <tr>
          <td style="
            background-color:#2dd4bf;
            height:5px;
            line-height:5px;
            font-size:0;
          ">
            &nbsp;
          </td>
        </tr>

        <!-- Header -->
        <tr>
          <td style="
            padding:32px 32px 8px 32px;
            text-align:center;
          ">

            <div style="
              font-size:38px;
              margin-bottom:8px;
            ">
              🏆
            </div>

            <h2 style="
              margin:0;
              color:#e6edf3;
              font-size:22px;
            ">
              Congratulations!
            </h2>

            <p style="
              margin:6px 0 0 0;
              color:#7d8590;
              font-size:13px;
            ">
              You qualified for the Sunday Contest
            </p>

          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:20px 32px;">

            <p style="
              color:#c9d1d9;
              font-size:15px;
              line-height:1.6;
            ">
              Hey
              <strong style="color:#2dd4bf;">
                ${data.user_id.firstName}
              </strong>,
            </p>

            <p style="
              color:#c9d1d9;
              font-size:15px;
              line-height:1.6;
            ">
              Great job in the Saturday contest! 🎉
              Your performance placed you among the
              <strong style="color:#e6edf3;">
                Top 80
              </strong>
              participants by rating.
            </p>

            <p style="
              color:#c9d1d9;
              font-size:15px;
              line-height:1.6;
            ">
              You have been promoted to the
              <strong style="color:#2dd4bf;">
                Sunday Contest
              </strong>.
            </p>

          </td>
        </tr>

        <!-- Rating -->
        <tr>
          <td style="padding:0 32px 24px 32px;">

            <table role="presentation"
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="
                background-color:#0d1117;
                border:1px solid #30363d;
                border-radius:8px;
              ">

              <tr>

                <td style="
                  padding:16px;
                  text-align:center;
                ">

                  <div style="
                    color:#2dd4bf;
                    font-size:20px;
                    font-weight:bold;
                  ">
                    ${data.ratingAfter}
                  </div>

                  <div style="
                    color:#7d8590;
                    font-size:11px;
                    margin-top:4px;
                  ">
                    NEW RATING
                  </div>

                </td>

                <td style="
                  padding:16px;
                  text-align:center;
                ">

                  <div style="
                    color:#2dd4bf;
                    font-size:20px;
                    font-weight:bold;
                  ">
                    ${data.score}
                  </div>

                  <div style="
                    color:#7d8590;
                    font-size:11px;
                    margin-top:4px;
                  ">
                    SCORE
                  </div>

                </td>

              </tr>

            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="
            padding:20px 32px;
            border-top:1px solid #30363d;
            text-align:center;
          ">

            <p style="
              color:#484f58;
              font-size:12px;
              margin:0;
            ">
              See you in the Sunday contest — keep grinding! 🔥
            </p>

            <p style="
              color:#484f58;
              font-size:11px;
              margin:8px 0 0 0;
            ">
              CodeJudge · This is an automated email
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>

</table>

</body>
</html>
          `,
        });
      }
    }

    // --------------------------------
    // Mark rating calculation complete
    // --------------------------------

    result.ratingCalculated = true;

    await result.save();

    console.log(
      `Rating calculated successfully for contest: ${result._id}`
    );

  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

export default calculateRatting;