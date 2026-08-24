// ==========================================
// MySpend - Expense Tracker
// ==========================================


// Get elements from HTML
const SUPABASE_URL = "https://hanuvdzlktkdarqraqeq.supabase.co";
const SUPABASE_KEY = "sb_publishable_qI3OmkMtsDNlTWa9Eb6mUQ_n826kvF5";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const purchaseForm = document.getElementById("purchaseForm");

const productNameInput = document.getElementById("productName");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("purchaseDate");

const purchaseList = document.getElementById("purchaseList");
const emptyState = document.getElementById("emptyState");

const totalSpentElement = document.getElementById("totalSpent");
const totalProductsElement = document.getElementById("totalProducts");
const averageSpentElement = document.getElementById("averageSpent");

const chartAmount = document.getElementById("chartAmount");
const overviewProducts = document.getElementById("overviewProducts");
const overviewAverage = document.getElementById("overviewAverage");
const overviewCategories = document.getElementById("overviewCategories");

const errorMessage = document.getElementById("errorMessage");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");


// Delete modal

const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");


// ==========================================
// DATA
// ==========================================

let purchases = JSON.parse(localStorage.getItem("mySpendPurchases")) || [];

let purchaseToDelete = null;


// ==========================================
// DEFAULT DATE
// ==========================================

const today = new Date().toISOString().split("T")[0];

dateInput.value = today;


// ==========================================
// CURRENCY FORMAT
// ==========================================

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);

}


// ==========================================
// SAVE DATA
// ==========================================

function savePurchases() {

    localStorage.setItem(
        "mySpendPurchases",
        JSON.stringify(purchases)
    );

}


// ==========================================
// ADD PURCHASE
// ==========================================

purchaseForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const productName = productNameInput.value.trim();

    const amount = Number(amountInput.value);

    const category = categoryInput.value;

    const date = dateInput.value;


    // Validate product name

    if (productName === "") {

        errorMessage.textContent =
            "Please enter a product name.";

        return;

    }


    // Validate amount

    if (!amount || amount <= 0) {

        errorMessage.textContent =
            "Please enter a valid amount greater than ₹0.";

        return;

    }


    // Clear error

    errorMessage.textContent = "";


    // Create purchase

    const purchase = {

        id: Date.now(),

        productName: productName,

        amount: amount,

        category: category,

        date: date

    };


    // Add purchase

    purchases.push(purchase);


    // Save

    savePurchases();


    // Reset form

    purchaseForm.reset();

    dateInput.value = today;


    // Update everything

    updateDashboard();

});


// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard() {

    updateStatistics();

    renderPurchases();

}


// ==========================================
// UPDATE STATISTICS
// ==========================================

function updateStatistics() {

    const total = purchases.reduce(
        (sum, purchase) => sum + purchase.amount,
        0
    );


    const count = purchases.length;


    const average = count > 0
        ? total / count
        : 0;


    // Categories used

    const categories = new Set(
        purchases.map(purchase => purchase.category)
    );


    // Main statistics

    totalSpentElement.textContent =
        formatCurrency(total);

    totalProductsElement.textContent =
        count;

    averageSpentElement.textContent =
        formatCurrency(average);


    // Overview

    chartAmount.textContent =
        formatCurrency(total);

    overviewProducts.textContent =
        count;

    overviewAverage.textContent =
        formatCurrency(average);

    overviewCategories.textContent =
        categories.size;


    // Update circle

    const circle = document.querySelector(".circle-chart");

    if (circle) {

        circle.style.background = `
            radial-gradient(circle, #13161f 58%, transparent 59%),
            conic-gradient(
                #62e6a7 ${count > 0 ? 100 : 0}%,
                #252b37 0%
            )
        `;

    }

}


// ==========================================
// GET FILTERED PURCHASES
// ==========================================

function getFilteredPurchases() {

    const searchText =
        searchInput.value.toLowerCase().trim();

    const selectedCategory =
        categoryFilter.value;


    let filtered = purchases.filter(purchase => {

        const matchesSearch =
            purchase.productName
                .toLowerCase()
                .includes(searchText);


        const matchesCategory =
            selectedCategory === "All" ||
            purchase.category === selectedCategory;


        return matchesSearch && matchesCategory;

    });


    // Sorting

    const sortType = sortSelect.value;


    if (sortType === "newest") {

        filtered.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

    }


    if (sortType === "oldest") {

        filtered.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

    }


    if (sortType === "high") {

        filtered.sort(
            (a, b) => b.amount - a.amount
        );

    }


    if (sortType === "low") {

        filtered.sort(
            (a, b) => a.amount - b.amount
        );

    }


    return filtered;

}


// ==========================================
// RENDER PURCHASES
// ==========================================

function renderPurchases() {

    const filteredPurchases =
        getFilteredPurchases();


    purchaseList.innerHTML = "";


    if (filteredPurchases.length === 0) {

        emptyState.style.display = "block";

        return;

    }


    emptyState.style.display = "none";


    filteredPurchases.forEach(purchase => {

        const item = document.createElement("div");

        item.className = "purchase-item";


        const icon =
            getCategoryIcon(purchase.category);


        const formattedDate =
            formatDate(purchase.date);


        item.innerHTML = `

            <div class="purchase-icon">
                ${icon}
            </div>

            <div class="purchase-details">

                <div class="purchase-name">
                    ${escapeHTML(purchase.productName)}
                </div>

                <div class="purchase-meta">
                    ${purchase.category}
                    ·
                    ${formattedDate}
                </div>

            </div>

            <div class="purchase-amount">
                ${formatCurrency(purchase.amount)}
            </div>

            <button
                class="delete-small"
                onclick="openDeleteModal(${purchase.id})"
                title="Delete"
            >
                🗑
            </button>

        `;


        purchaseList.appendChild(item);

    });

}


// ==========================================
// CATEGORY ICON
// ==========================================

function getCategoryIcon(category) {

    const icons = {

        Clothing: "👕",

        Electronics: "🎧",

        Food: "🍔",

        Education: "📚",

        Entertainment: "🎮",

        Travel: "✈️",

        Shopping: "🛍️",

        Other: "📦"

    };


    return icons[category] || "📦";

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(dateString) {

    if (!dateString) {
        return "No date";
    }


    const date = new Date(dateString);


    return date.toLocaleDateString("en-IN", {

        day: "numeric",

        month: "short",

        year: "numeric"

    });

}


// ==========================================
// DELETE MODAL
// ==========================================

function openDeleteModal(id) {

    purchaseToDelete = id;

    deleteModal.classList.add("show");

}


function closeDeleteModal() {

    purchaseToDelete = null;

    deleteModal.classList.remove("show");

}


cancelDelete.addEventListener(
    "click",
    closeDeleteModal
);


confirmDelete.addEventListener(
    "click",
    function() {

        if (purchaseToDelete === null) {
            return;
        }


        purchases = purchases.filter(
            purchase => purchase.id !== purchaseToDelete
        );


        savePurchases();

        updateDashboard();

        closeDeleteModal();

    }
);


// ==========================================
// SEARCH
// ==========================================

searchInput.addEventListener(
    "input",
    renderPurchases
);


// ==========================================
// CATEGORY FILTER
// ==========================================

categoryFilter.addEventListener(
    "change",
    renderPurchases
);


// ==========================================
// SORT
// ==========================================

sortSelect.addEventListener(
    "change",
    renderPurchases
);


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ==========================================
// INITIAL LOAD
// ==========================================

updateDashboard();
