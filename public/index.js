const ws = io()

ws.on("ROOM_LIST", handleListingRooms)

function handleListingRooms(rooms) {
  if (rooms.length === 0) return;
  document.querySelector("#rooms").innerHTML = `
    <ol>
    ${
    rooms.map((room) =>
      `<li class="no-margin">
        <p>
          <a href="/room/${room.id}">${room.name}</a>
          <button class="delete-room" data-room-id="${room.id}">❌</button>
        </p>
        <p>Created By: ${room.createdBy.username}</p>
      </li>`
    ).join("")
  }
    </ol>
  `;
  document.querySelectorAll("button.delete-room").forEach((btn) => {
    btn.onclick = function (e) {
      const roomID = e.target.dataset.roomId;
      console.log(roomID);
    };
  });
}
