@echo off

:: Активация виртуального окружения
call D:\ugc\venv\Scripts\activate.bat


:: Запуск сервера Django
python manage.py runserver

:: Оставить окно открытым после завершения
pause
