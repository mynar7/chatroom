const ws = io();

const roomID = location.pathname.split("/").pop();

ws.on("MESSAGE_TO_CLIENT", (data) => {
  const { authorName, message } = data;
  const p = document.createElement("p");
  p.innerHTML = `<span>${authorName}: </span> ${message}`;
  document.querySelector("#chat").prepend(p);
});

ws.on("connect", () => {
  if (!roomID) return location.replace("/");
  ws.emit("USER_JOINED", { roomID });
});

ws.on("disconnect", () => {
  location.replace("/")
})

document.querySelector("form").onsubmit = function (e) {
  e.preventDefault();
  ws.emit("MESSAGE_TO_SERVER", {
    roomID,
    message: e.target.message.value,
  });
  e.target.message.value = "";
};
