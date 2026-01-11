# TSTET Online Examination System

Hey there! 👋 This is a web-based exam platform built specifically for conducting TSTET (Telangana State Teacher Eligibility Test) exams online. Think of it as bringing the traditional pen-and-paper exam experience to the web, but with added conveniences like automatic timing, instant results, and easy navigation.

## What's This About?

TSTET is an important qualifying exam for aspiring teachers in Telangana. This project digitizes the whole exam-taking experience - from login to viewing results - making it accessible from anywhere with an internet connection.

## Key Features

- **Login & Get Started**: Secure token-based authentication keeps things safe
- **Multiple Sections**: Just like the real exam - Child Development, Mathematics, Languages, and more
- **Live Timer**: Counts down automatically, no cheating the clock!
- **Smart Navigation**: Jump between questions, sections, or go sequential - your choice
- **Visual Question Tracking**: See at a glance what you've answered, skipped, or marked
- **One Shot Only**: Can't retake an exam you've already attempted (fair's fair!)
- **Instant Results**: See how you did right after submitting, with detailed explanations
- **Anti-Cheating**: Can't go back once you're in or after you finish

## Technology Used

**Backend**: Django 5.2.8 + Django REST Framework (Python)  
**Frontend**: Angular 21 (TypeScript)  
**Database**: SQLite (easy to switch to PostgreSQL later)  
**Auth**: Token-based, simple and secure

## Quick Start

### What You'll Need
- Python 3.8 or higher
- Node.js 18+ and npm
- A code editor (VS Code recommended)

### Setting Up the Backend

```bash
# Jump into the backend folder
cd exam_backend

# Create a virtual environment (keeps things clean)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install what we need
pip install django djangorestframework django-cors-headers

# Set up the database
python manage.py migrate

# Create an admin account for yourself
python manage.py createsuperuser

# Load some sample exam questions (optional but helpful)
python manage.py create_exam --sample

# Fire it up!
python manage.py runserver
```

Your backend is now running at `http://127.0.0.1:8000/` 🎉

### Setting Up the Frontend

Open a new terminal window:

```bash
# Go to the frontend folder
cd exam-frontend

# Install dependencies
npm install

# Start the dev server
npm start
```

Visit `http://localhost:4200/` and you're good to go! 🚀

## Creating Test Users

**Quick way** - Use Django shell:
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User
User.objects.create_user('student1', password='test123')
```

**Admin way** - Go to `http://127.0.0.1:8000/admin/` and create users through the interface.

## How It Works

1. **Login** with your username and password
2. **Pick an exam** from the list (you'll see which ones you've already taken)
3. **Take the exam**:
   - Navigate using section tabs or question numbers
   - Answer at your own pace, but watch the timer!
   - Submit when done (or it auto-submits when time's up)
4. **Check your results** with detailed breakdowns of right and wrong answers

## Project Structure

```
TSTET/
├── exam_backend/          # Django backend
│   ├── core/             # Main app (models, views, APIs)
│   └── exam_backend/     # Settings and config
│
└── exam-frontend/        # Angular frontend
    └── src/app/pages/    # Login, Exam, Results pages
```

## Want to Customize?

**Add more questions**: Use the Django admin panel or create a JSON file and load it  
**Change exam duration**: Edit the exam model or pass it when creating new exams  
**Modify styling**: CSS files are in each component's folder  
**Add new sections**: Easy to do through Django admin or programmatically

## Testing

```bash
# Backend tests
cd exam_backend && python manage.py test

# Frontend tests
cd exam-frontend && npm test
```

## Going Live?

Before deploying to production:
- Switch to PostgreSQL (SQLite is just for development)
- Set `DEBUG = False` in Django settings
- Use proper CORS settings (don't allow all origins!)
- Serve frontend using Nginx or similar
- Use environment variables for secrets

## What's Next?

Some ideas I'm thinking about:
- Bookmarking questions for review
- PDF certificates for results
- Mobile app version
- Multi-language support (Telugu, Hindi)
- Admin analytics dashboard

## Issues? Questions?

Feel free to open an issue or reach out. This is a learning project, so feedback is always welcome!

## License

Free to use for educational purposes. Modify as you need!

---

Built with ☕ and code by Purna

**Note**: This is a development version. Add proper security before using with real users!
