import { eventHandlers } from "../eventHandlers/exercise-list.event-handler.js";

document.getElementById("pageSizeSelect").addEventListener("change", eventHandlers.setPageSize);
document.getElementById("previousPageBtn").addEventListener("click", eventHandlers.handleClickForAllPaginationButttons);
document.getElementById("nextPageBtn").addEventListener("click", eventHandlers.handleClickForAllPaginationButttons);
