const socket = io(); //connection to io
//elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
// const $location = document.querySelector("#location");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
//options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

//autoscroll
const autoscroll = () => {
  //new message element
  const $newMessage = $messages.lastElementChild;

  //height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = $messages.offsetHeight;
  //height of messages container
  const containerHeight = $messages.scrollHeight;
  //how far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;
  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};
//1. recieve message and send to console
socket.on("message", (message) => {
  console.log(message); //recieving message from server

  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

//2. send location message
socket.on("locationMessage", (message) => {
  console.log(message);

  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

//3 recieve teh room data
socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

//4.send message from input to server
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");
  //disable button because of loading
  const message = e.target.elements.message.value;

  socket.emit("sendMessage", message, (message) => {
    //enable button
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    console.log("The message was delievered ");
    console.log("Server:" + message);
  }); //send message to server
});

//5. location
$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supprted by your browser");
  }
  //disable button
  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const locations = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    socket.emit("sendLocation", locations, (message) => {
      //enable button
      $sendLocationButton.removeAttribute("disabled");
      console.log("The location shared");
      console.log("Server: " + message);
    }); // send location to server
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
