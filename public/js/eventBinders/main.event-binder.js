import { eventHandler } from "../eventHandlers/main.event-handler.js";

// fires on page load
document.addEventListener("DOMContentLoaded", eventHandler.onDOMContentLoaded);

// fires when a storage area has been modified
// Note: By default, this won't work in the current tab (source: https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
// To work in the current tab, dispatch a storage event after each update (source: https://stackoverflow.com/a/65348883)
window.addEventListener("storage", eventHandler.updateCartComponent);

document.getElementById("clear-cart").addEventListener("click", eventHandler.clearCart);
