const button = document.getElementById("btn");
const userCard = document.getElementById("user-card");

button.addEventListener("click", getUser);

function getUser(){

    fetch("https://randomuser.me/api/")
    .then(response => response.json())
    .then(data => {

        const user = data.results[0];

        userCard.innerHTML = `
            <img src="${user.picture.large}">
            <h2>${user.name.first} ${user.name.last}</h2>
            <p>${user.email}</p>
        `;
    })
    .catch(error => {
        console.log("Error:", error);
    });

}