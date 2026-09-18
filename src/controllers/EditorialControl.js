import Problem from "../models/problem.js";
import EditorialS from "../models/Editorial.js";
import cloudinary from "../config/cloudflare.js";

async function CreateEditorial(req, res) {
  try {
    const { Problem_id, title, languages, sections, media } = req.body;

    const isValid = await Problem.findById(Problem_id);
    if (!isValid)
      return res.status(400).json({ message: "ProblemId is not valid." });

    const isAvail = await EditorialS.findOne({ Problem_id });
    if (isAvail)
      return res.status(409).json({ message: "Editorial already exists." });

    const result = await EditorialS.create({
      Problem_id,
      User_id: req.result._id, // never from client
      title,
      languages,
      sections,
      media,
    });

    res
      .status(201)
      .json({ message: "Editorial created successfully.", editorial: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function UpdateEditorial(req, res) {
  try {
    const { problemID } = req.params;
    const EditorialInfo = await EditorialS.findOne({ Problem_id: problemID });
    if (!EditorialInfo)
      return res.status(400).json({ message: "Editorial Not Found..." });
    const keys = ["title", "languages", "sections"];
    const Usrkeys = Object.keys(req.body);
    const filterdata = keys.filter((data) => Usrkeys.includes(data));
    for (const data of filterdata) {
      EditorialInfo[data] = req.body[data];
    }
    await EditorialInfo.save();
    res.status(200).json({ message: "EditorialUpdated SuccessFully..." });
  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
};

async function FetchEditorial(req, res) {
  try {
    const { problemID } = req.params;

    const result = await EditorialS.findOne({
      Problem_id: problemID,
    }).lean();

    if (!result) {
      return res.status(404).json({
        message: "Data Not found...",
      });
    }

    const media = result.media.map((item) => {
      const url = cloudinary.url(item.publicId, {
        resource_type: item.type,
        type: "upload",
        sign_url: true,
        secure: true,
      });

      return {
        type: item.type,
        url: url,
      };
    });

    result.media = media;

    return res.status(200).json({
      message: "Data fetched...",
      response: result,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

async function deleteEditorial(req, res) {
  try {
    const { problemID } = req.params;

    const result = await EditorialS.findOne({ Problem_id: problemID });

    if (!result) {
      return res.status(404).json({
        message: "Data Not found...",
      });
    }

    if (result.media?.length) {
      for (const data of result.media) {
        if (!data.publicId) continue;

        const cloudinaryResult = await cloudinary.uploader.destroy(
          data.publicId,
          {
            resource_type: data.type,
          },
        );

        console.log("Cloudinary:", cloudinaryResult);
      }
    };

    await EditorialS.findOneAndDelete({Problem_id: problemID})
    return res.status(200).json({
      message: "Editorial Deleted Successfully...",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: err.message,
    });
  }
};

export default {
  CreateEditorial,
  UpdateEditorial,
  FetchEditorial,
  deleteEditorial,
};
