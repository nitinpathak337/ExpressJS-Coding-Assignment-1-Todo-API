const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`DB Error:'{e.message}';`);
  }
};

initializeDB();

//get todo list API

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = request.query;
  if (status !== "" && possibleStatus.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (priority !== "" && possiblePriority.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (category !== "" && possibleCategory.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    const selectTodosQuery = `
    select id,todo,priority,status,
    category,due_date as dueDate
    from todo where status like '%${status}%'
    and priority like '%${priority}%' and
    todo like '%${search_q}%' and 
    category like '%${category}%';
    `;
    const selectTodos = await db.all(selectTodosQuery);
    response.send(selectTodos);
  }
});

//get todo API

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const selectTodoQuery = `select id,todo,priority,status,
    category,due_date as dueDate
    from todo where id=${todoId};`;
  const selectTodo = await db.get(selectTodoQuery);
  response.send(selectTodo);
});

const fixDate = (date) => {
  let d = date.split("-");

  const newDate = format(
    new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2])),
    "yyyy-MM-dd"
  );
  return newDate;
};

//get todo based on due date API

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const dateObj = new Date(date);
  if (isValid(dateObj) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const newDate = fixDate(date);

    const getQuery = `
            select id,todo,priority,status,
            category,due_date as dueDate
            from todo where due_date = '${newDate}';`;
    const get = await db.all(getQuery);
    response.send(get);
  }
});

const possibleStatus = ["TO DO", "IN PROGRESS", "DONE"];
const possiblePriority = ["HIGH", "MEDIUM", "LOW"];
const possibleCategory = ["WORK", "HOME", "LEARNING"];

//post todo API

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const dateObj = new Date(dueDate);
  if (possibleStatus.includes(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (possiblePriority.includes(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (possibleCategory.includes(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (isValid(dateObj) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const newDate = fixDate(dueDate);
    const insertTodoQuery = `
  Insert into todo
  values (${id},'${todo}','${priority}',
  '${status}','${category}','${newDate}');`;
    const insertTodo = await db.run(insertTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//update todo API

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const {
    status = "",
    priority = "",
    todo = "",
    category = "",
    dueDate = "",
  } = request.body;
  if (status !== "") {
    if (possibleStatus.includes(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const updateTodoQuery = `
            update todo
            set status='${status}'
            where id=${todoId};`;
      const updateTodo = await db.run(updateTodoQuery);
      response.send("Status Updated");
    }
  }
  if (priority !== "") {
    if (possiblePriority.includes(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const updateTodoQuery = `
            update todo
            set priority='${priority}'
            where id=${todoId};`;
      const updateTodo = await db.run(updateTodoQuery);
      response.send("Priority Updated");
    }
  }
  if (todo !== "") {
    const updateTodoQuery = `
            update todo
            set todo='${todo}'
            where id=${todoId};`;
    const updateTodo = await db.run(updateTodoQuery);
    response.send("Todo Updated");
  }
  if (category !== "") {
    if (possibleCategory.includes(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const updateTodoQuery = `
            update todo
            set category='${category}'
            where id=${todoId};`;
      const updateTodo = await db.run(updateTodoQuery);
      response.send("Category Updated");
    }
  }
  if (dueDate !== "") {
    const dateObj = new Date(dueDate);
    if (isValid(dateObj) === false) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      const newDate = fixDate(dueDate);
      const updateTodoQuery = `
            update todo
            set due_date='${newDate}'
            where id=${todoId};`;
      const updateTodo = await db.run(updateTodoQuery);
      response.send("Due Date Updated");
    }
  }
});

//delete todo API

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    delete from todo
    where id=${todoId}`;
  const deleteTodo = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
