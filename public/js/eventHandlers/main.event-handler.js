export const eventHandler = {
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

    updateCartIcon: async () => {
        const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
        if (cartItems) {
            // update chart icon
            const cartSpan = document.getElementById("cart-icon-span");
            cartSpan.textContent = cartItems.length;

            // update chart buttons
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

            const cartMenuUl = document.getElementById("cart-menu-ul");

            // remove dynamic created nodes
            cartMenuUl.querySelectorAll(".dynamic-node").forEach((x) => x.remove());

            // add the chart element to the dropdown list
            let currentLiNode = null;
            cartItems.forEach((x) => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.classList.add("dropdown-item", "dynamic-node", "pe-2");
                a.setAttribute("href", `/cursuri/${x.courseId}/exercitii/${x.exerciseId}`);
                a.innerText = `E.${x.exerciseCode}`;

                const i = document.createElement("i");
                i.classList.add("bi", "bi-x", "float-end");
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
        }
    },
};
