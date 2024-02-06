const createNewSheetInLessonAnchor = document.getElementById("create-sheet-in-lesson");

const oldHref = createNewSheetInLessonAnchor?.getAttribute("href"); // we have a value in lesson, otherwise null

export const eventHandler = {
    onDOMContentLoaded: async () => {
        // Update the cart component
        eventHandler.updateCartComponent();
    },

    updateCartComponent: async () => {
        // Update the number in the cart icon
        const cartBadge = document.getElementById("cart-badge");
        if (!cartBadge) return;

        const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        cartBadge.textContent = cartItems.length;

        // Update add-to-chart buttons
        document.querySelectorAll(".add-to-cart-btn").forEach((target) => {
            const exerciseId = target.dataset.exerciseId;

            const find = cartItems.find((x) => x.exerciseId == exerciseId);
            if (find) {
                target.classList.add("d-none");

                const parentDiv = target.closest(".exercise-menu-div");
                const removeFromCartBtn = parentDiv.querySelector(".remove-from-cart-btn");
                if (removeFromCartBtn) removeFromCartBtn.classList.remove("d-none");
            } else {
                target.classList.remove("d-none");

                const parentDiv = target.closest(".exercise-menu-div");
                const removeFromCartBtn = parentDiv.querySelector(".remove-from-cart-btn");
                if (removeFromCartBtn) removeFromCartBtn.classList.add("d-none");
            }
        });

        // Update the drop-down menu for the cart
        const cartMenuUl = document.getElementById("cart-menu-ul");

        // Remove dynamic created nodes
        cartMenuUl.querySelectorAll(".dynamic-node").forEach((x) => x.remove());

        // Add the chart element to the dropdown list
        let currentLiNode = null;
        cartItems.forEach((x) => {
            const li = document.createElement("li");
            li.classList.add("dynamic-node");

            const a = document.createElement("a");
            a.classList.add("dropdown-item", "pe-2");
            a.setAttribute("href", `/exercitii/${x.exerciseId}`);
            a.innerText = `E.${x.exerciseCode}`;

            const i = document.createElement("i");
            i.classList.add("bi", "bi-x", "float-end", "bg-light");
            // How to pass arguments to addEventListener: https://stackoverflow.com/a/55859799
            i.addEventListener("click", (evt) => eventHandler.deleteCartItem(evt, x.exerciseId));

            a.appendChild(i);

            li.appendChild(a);

            if (currentLiNode == null) {
                // insert the first exercise in the first position
                cartMenuUl.prepend(li);
            } else {
                // insert exercise_2 after exercise_1 and so on
                currentLiNode.after(li);
            }
            currentLiNode = li;
        });

        // Change the text for the last dropdown item if the cart is empty
        const clearCart = document.getElementById("clear-cart");
        clearCart.innerText = cartItems.length > 0 ? "Golește coșul" : "Coșul este gol";

        // If the cart is not empty, set the nav-toggler color to red
        const navbarTogglerBtn = document.querySelector(".navbar-toggler");
        if (cartItems.length > 0) navbarTogglerBtn.classList.add("has-cart-items");
        else navbarTogglerBtn.classList.remove("has-cart-items");

        // If the cart is not empty, set some space between icon and text
        const cartSpan = document.getElementById("cart-span");
        if (cartItems.length > 0) cartSpan.classList.replace("me-2", "me-3");
        else cartSpan.classList.replace("me-3", "me-2");

        // If the cart is not empty, set the href for 'Add to a new sheet' menu item
        if (cartItems.length > 0) {
            const exercisesParam = [];
            cartItems.forEach((x) => exercisesParam.push({ e: x.exerciseId, c: x.courseId }));
            const createNewSheetAnchor = document.getElementById("create-new-sheet");
            createNewSheetAnchor.setAttribute("href", "/fise/adauga?cart=" + JSON.stringify(exercisesParam));

            if (createNewSheetInLessonAnchor) {
                createNewSheetInLessonAnchor.setAttribute("href", `${oldHref}?cart=${JSON.stringify(exercisesParam)}`);
            }
        }

        // If the cart is empty, hide the red badge and also some dropdown menu items
        const elements = document.querySelectorAll(".hide-on-empty-cart");
        elements.forEach((x) => x.classList.toggle("d-none", cartItems.length == 0));
    },

    clearCart: async () => {
        const cartItems = [];
        localStorage.setItem("cart", JSON.stringify(cartItems));

        // in main.event-handler.js we have a listener that updates the chart buttons and the chart icon: https://stackoverflow.com/a/65348883
        window.dispatchEvent(new Event("storage"));
    },

    deleteCartItem: async (event, exerciseId) => {
        event.preventDefault(); // prevent calling the href
        event.stopPropagation(); // prevent closing the dropdown menu

        let cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        cartItems = cartItems.filter((x) => x.exerciseId !== exerciseId);
        localStorage.setItem("cart", JSON.stringify(cartItems));

        // in main.event-handler.js we have a listener that updates the chart buttons and the chart icon: https://stackoverflow.com/a/65348883
        window.dispatchEvent(new Event("storage"));
    },
};
