const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const app = express();

const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

app.use(express.json());
let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started running http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Db error ${error.message}`);
    process.exit(1);
  }
};
initializeDbServer();

//API 1
let convertAPI = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
  };
};

const hasPriorityAndStatusProps = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProps = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProps = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProps(request.query):
      getTodosQuery = `
          SELECT * FROM todo WHERE status='${status}' AND priority='${priority}';`;
      break;
    case hasStatusProps(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE status='${status}';`;
      break;
    case hasPriorityProps(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE priority='${priority}';`;
      break;
    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodosQuery);
  let getConvertedData = data.map((each) => convertAPI(each));
  response.send(getConvertedData);
  console.log(getConvertedData);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const getResponse = await db.get(getTodoQuery);
  response.send(convertAPI(getResponse));
  console.log(convertAPI(getResponse));
});

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  //const { id } = request.params;
  const { id, priority, status, todo } = todoDetails;
  const postTodoQuery = `INSERT INTO todo(id, todo,priority,status) VALUES('${id}','${todo}','${priority}','${status}');`;
  const ans = await db.run(postTodoQuery);
  console.log(ans);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//DELETE todo

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  //console.log("a");
  response.send("Todo Deleted");
});

module.exports = app;
