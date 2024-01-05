const ws = new WebSocket("ws://" + location.host);

ws.onmessage = e => {
  const {type, data} = JSON.parse(e.data)
  switch(type) {
    case 'MESSAGE_TO_CLIENT':
      const {authorName, message} = data
      const p = document.createElement('p')
      p.innerHTML = `<span>${authorName}: </span> ${message}`
      document.querySelector('#chat').prepend(p)
      return
  }
}

ws.onopen = () => {
  const roomID = location.pathname.split('/').pop()
  if (!roomID) location.replace('/')
  ws.send(JSON.stringify({
    type: "USER_JOINED",
    data: {
      roomID,
    }
  }))
}

document.querySelector('form').onsubmit = function(e) {
  e.preventDefault()
  const roomID = location.pathname.split('/').pop()
  ws.send(JSON.stringify({
    type: "MESSAGE_TO_SERVER",
    data: {
      roomID,
      message: e.target.message.value
    }
  }))
  e.target.message.value = ""
}

