@echo off

start "Backend" cmd /k "cd /d Z:\Intern ship\MaterialDisbursementSystem(Program3)\Indirect-Expense\backend && npx nodemon server.js"

start "Frontend" cmd /k "cd /d Z:\Intern ship\MaterialDisbursementSystem(Program3)\Indirect-Expense\Frontend && npx ng serve --host 10.120.126.138 --port 4200"

pause