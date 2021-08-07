import { domHelper } from "../helpers/dom.helper.js";

export const toastService = {
    success: (msg) => {
        const message = msg || "Operație finalizată cu succes! ";
        addToast("success", message);
    },
    error: (msg) => {
        const message = msg || "Operație finalizată cu eroare! ";
        addToast("error", message);
    },
};

function addToast(type, message) {
    let background = "";
    const autohide = true;
    let delay = 5000; // 5000 ms (default)
    switch (type) {
        case "success":
            background = "success";
            delay = 2000;
            break;
        case "error":
            background = "danger";
            delay = 6000;
            //autohide = false;
            break;
    }
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${background} border-0" role="alert" data-bs-autohide=${autohide}>
            <div class="d-flex">
                <div class="toast-body">
                ${message} 
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    const toastEl = domHelper.htmlToElement(toastHtml);

    //on close, remove the toast from the DOM
    toastEl.addEventListener("hidden.bs.toast", function () {
        toastEl.remove();
    });

    // add this new toastElement to the parent container
    const toastContainer = document.getElementById("toast-container");
    toastContainer.append(toastEl);

    const options = { delay };
    const toast = new window.bootstrap.Toast(toastEl, options);
    toast.show();
}
