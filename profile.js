const isAuth = localStorage.getItem("isAuth");
const storedUserId = localStorage.getItem("userId");
const userId = window.location.search.split("=").at(-1);

function logOut() {
  localStorage.removeItem("isAuth");
  localStorage.removeItem("userId");
  window.location.href = "index.html";
}

if (!isAuth || userId !== storedUserId) {
  logOut()
}

const logoutBtn = document.querySelector(".logout-btn");

logoutBtn.addEventListener("click", logOut);

const headerSpan = document.querySelector(".header-span");

class ApiService {
  static async getUsers() {
    const response = await fetch(
      "https://bever-aca-assignment.azurewebsites.net/users"
    );
    const data = await response.json();
    return data.value;
  }

  static async getInvoices() {
    const response = await fetch(
      "https://bever-aca-assignment.azurewebsites.net/invoices"
    );
    const data = await response.json();
    return data.value;
  }

  static async getInvoiceLines() {
    const response = await fetch(
      "https://bever-aca-assignment.azurewebsites.net/invoicelines"
    );
    const data = await response.json();
    const productsOfInvoices = {};
    data.value.forEach((invoiceLine) => {
      if (productsOfInvoices.hasOwnProperty(invoiceLine.InvoiceId)) {
        productsOfInvoices[invoiceLine.InvoiceId] = {
          ...productsOfInvoices[invoiceLine.InvoiceId],
          [invoiceLine.ProductId]: invoiceLine.Quantity,
        };
      } else {
        productsOfInvoices[invoiceLine.InvoiceId] = {
          [invoiceLine.ProductId]: invoiceLine.Quantity,
        };
      }
    });

    return [data.value, productsOfInvoices];
  }

  static async getProducts() {
    const response = await fetch(
      "https://bever-aca-assignment.azurewebsites.net/products"
    );
    const data = await response.json();
    const productsPrices = {};
    data.value.forEach(
      (product) => (productsPrices[product.ProductId] = product.Price)
    );

    return [data.value, productsPrices];
  }
}

function toFormatDate(dateStr) {
  const date = new Date(dateStr);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
}

function handleException(error) {
  console.log(error);
  alert("something went wrong");
}

async function createInvoicesTable() {
  const invoices = (await ApiService.getInvoices()).filter(
    (invoice) => invoice.UserId === userId
  );
  const productsOfInvoices = (await ApiService.getInvoiceLines())[1];
  const productsPrices = (await ApiService.getProducts())[1];
  const table = document.createElement("table");
  table.classList.add("invoices-table");

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  thead.innerHTML = `
        <tr>
            <th></th>
            <th>Invoice Name</th>
            <th>Paid Date</th>
            <th>Total Amount</th>
        </tr>
    `;

  // create table rows
  tbody.innerHTML = `
        ${invoices
          .map((invoice, index) => {
            const invoiceProducts = productsOfInvoices[invoice.InvoiceId];
            let totalAmount = 0;
            for (let product in invoiceProducts) {
              totalAmount += productsPrices[product] * invoiceProducts[product];
            }
            return `
                <tr>
                    <td><input type="radio" ${
                      index === 0 ? "checked" : ""
                    } name="invoice-radio" data-invoice-id="${
              invoice.InvoiceId
            }" /></td>
                    <td>${invoice.Name}</td>
                    <td>${toFormatDate(invoice.PaidDate)}</td>
                    <td>${totalAmount}</td>
                </tr>`;
          })
          .join("")}
    `;
  table.appendChild(thead);
  table.appendChild(tbody);

  return [table, invoices[0].InvoiceId];
}

async function createInvoiceLinesTable(invoiceId) {
  const invoiceLines = (await ApiService.getInvoiceLines())[0].filter(
    (invoiceLine) => invoiceLine.InvoiceId === invoiceId
  );
  const products = (await ApiService.getProducts())[0].filter((product) =>
    invoiceLines.find(
      (invoiceLine) => invoiceLine.ProductId === product.ProductId
    )
  );
  const table = document.createElement("table");
  table.classList.add("invoiceLine-table");

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  thead.innerHTML = `
        <tr>
            <th>Product</th>
            <th>Price Per Unit</th>
            <th>Quantity</th>
            <th>Total Amount</th>
        </tr>
    `;

  tbody.innerHTML = `
        ${products
          .map((product) => {
            const quantity = invoiceLines.filter(
              (invoiceLine) => invoiceLine.ProductId === product.ProductId
            )[0].Quantity;
            const totalAmount = quantity * product.Price;
            return `
                <tr>
                    <td>${product.Name}</td>
                    <td>${product.Price}</td>
                    <td>${quantity}</td>
                    <td>${totalAmount}</td>
                </tr>`;
          })
          .join("")}
    `;
  table.appendChild(thead);
  table.appendChild(tbody);

  return table;
}

ApiService.getUsers()
  .then((result) => {
    result.find((user) => {
      if (user.UserId === userId) {
        headerSpan.innerHTML = user.Name;
      }
    });
  })
  .catch(handleException);

const mainContainer = document.querySelector(".main-container");

createInvoicesTable().then(([table, firstInvoiceId]) => {
  mainContainer.appendChild(table);
  createInvoiceLinesTable(firstInvoiceId)
    .then((table) => {
      const invoiceLineTable =
        mainContainer.querySelector(".invoiceLine-table");
      if (invoiceLineTable) mainContainer.removeChild(invoiceLineTable);
      mainContainer.appendChild(table);
    })
    .catch(handleException);

  table.addEventListener("change", (event) => {
    if (event.target.type === "radio") {
      const selectedId = event.target.dataset.invoiceId;
      createInvoiceLinesTable(selectedId)
        .then((table) => {
          const invoiceLineTable =
            mainContainer.querySelector(".invoiceLine-table");
          if (invoiceLineTable) mainContainer.removeChild(invoiceLineTable);
          mainContainer.appendChild(table);
        })
        .catch(handleException);
    }
  });
});
