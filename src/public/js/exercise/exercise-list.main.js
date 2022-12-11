import { eventHandlers } from "./exercise-list.event-handler.js";

document
    .getElementById("pageSizeSelect")
    .addEventListener("change", eventHandlers.setPageSize);
// document.querySelector("ul.pagination").addEventListener("click", eventHandlers.handleClickForAllPaginationButttons);
//document.getElementById("pagination-buttons").addEventListener("click", eventHandlers.handleClickForAllPaginationButttons);
document
    .getElementById("previousPageBtn")
    .addEventListener(
        "click",
        eventHandlers.handleClickForAllPaginationButttons
    );
document
    .getElementById("nextPageBtn")
    .addEventListener(
        "click",
        eventHandlers.handleClickForAllPaginationButttons
    );
