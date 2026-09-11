const now =new Date();
const lastActive=new Date();

let today=new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
)
let lastActiveDate=new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
)

const diff=Math.floor(
    (today - lastActiveDate) / (1000 * 60 * 60 * 24)
);
today=today/(1000 * 60 * 60 * 24)
lastActiveDate=lastActiveDate/(1000*60*60*24);
console.log(today);
console.log(lastActiveDate);