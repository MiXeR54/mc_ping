const { ping } = require("./index");

//для теста взял сервачок с геморным описанием в ANSI
ping("mr.fawemc.me", 25565, (error, result) => {
  if (error) {
    console.error(error);
  } else {
    console.log(result);
  }
});
