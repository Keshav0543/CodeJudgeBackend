function getWeekendRange() {
  const istDateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const today = new Date(istDateString);
  const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday

  let daysToSaturday;

  if (currentDay === 0) {
    // Aaj Sunday hai -> Saturday kal (yesterday) tha
    daysToSaturday = -1;
  } else {
    // Monday(1) se Saturday(6) tak -> upcoming ya aaj wala Saturday
    daysToSaturday = 6 - currentDay;
  }

  const startOfSaturday = new Date(today);
  startOfSaturday.setDate(today.getDate() + daysToSaturday);
  startOfSaturday.setHours(0, 0, 0, 0);

  const startOfMonday = new Date(startOfSaturday);
  startOfMonday.setDate(startOfSaturday.getDate() + 2);
  startOfMonday.setHours(0, 0, 0, 0);

  return { startOfSaturday, startOfMonday };
}

export default getWeekendRange;