# 💍 BodaCyS – Interactive Wedding Invitation

A responsive web application for digital wedding invitations, designed to provide guests with an elegant and interactive experience while simplifying RSVP management for the hosts.

## Live Demo
- GitHub Pages: https://uliseszz.github.io/BodaCyS/

---

## Features

- Responsive design for desktop and mobile devices
- Interactive countdown timer
- Event information
- Google Maps integration
- Photo gallery
- RSVP form
- Smooth scrolling navigation
- Animated user interface
- Guest confirmation management

---

## Technologies

### Frontend

- HTML5
- CSS3
- JavaScript (Vanilla)
- Bootstrap

### Backend

- Google Apps Script
- Google Sheets

---

## Project Architecture

```
Guest
   │
   ▼
Web Interface
(HTML, CSS, JavaScript)
   │
   ▼
Google Apps Script
   │
   ▼
Google Sheets Database
```

The application is built as a static frontend hosted on Netlify and GitHub Pages.

When a guest submits the RSVP form, JavaScript sends the information to a Google Apps Script endpoint. The Apps Script validates the request and stores the guest information in a Google Sheets spreadsheet, which acts as the project's lightweight database.

This architecture avoids the need for a traditional backend server while providing reliable data collection and simple deployment.

---

## Backend Workflow

1. Guest completes the RSVP form.
2. JavaScript validates the required fields.
3. The data is sent through an HTTP request to a Google Apps Script Web App.
4. Google Apps Script processes the request.
5. Guest information is stored in Google Sheets.
6. A success or error response is returned to the website.

---

## Repository Structure

```
.
├── index.html
├── css/
├── js/
├── images/
├── fonts/
└── README.md
```

---

## Running Locally

Clone the repository

```bash
git clone https://github.com/UlisesZz/BodaCyS.git
```

Open

```
index.html
```

using your preferred web browser.

---

## Deployment

The project is deployed on:

- Netlify
- GitHub Pages

No compilation or build process is required.

---

## Author

Ulises Hernández

GitHub:
https://github.com/UlisesZz

LinkedIn:
https://www.linkedin.com/in/ulises13/

---

## License
This project is intended for educational purposes.

