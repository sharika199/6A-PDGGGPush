const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//1 Get Books API

const qq = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
app.get("/states/", async (request, response) => {
  const getBooksQuery = `
    SELECT
      *
    FROM
      state;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray.map((state) => qq(state)));
});

//2Get Book API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getBooksQuery = `
    SELECT
      *
    FROM
      state
    WHERE
    state_id=${stateId};`;
  const booksArray = await db.get(getBooksQuery);
  response.send(qq(booksArray));
});

//3
app.post("/districts/", async (request, response) => {
  const dDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = dDetails;

  const addBookQuery = `
    INSERT INTO
      district (district_name, state_id, cases, cured, active, deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths});`;
  const dbResponse = await db.run(addBookQuery);
  response.send("District Successfully Added");
});

//4
const DIn = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getBook = `SELECT * FROM district WHERE district_id=${districtId};`;
  const book = await db.get(getBook);
  response.send(DIn(book));
});

//5

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;

  const deleteBookQuery = `
    DELETE FROM
        district
    WHERE
        district_id = ${districtId};`;

  await db.run(deleteBookQuery);
  response.send("District Removed");
});

//6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const bookDetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = bookDetails;

  const updateBookQuery = `
    UPDATE
      district
    SET
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths= ${deaths}
     
    WHERE
      district_id = ${districtId};`;

  await db.run(updateBookQuery);
  response.send("District Details Updated");
});

//7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getBooksQuery = `
    SELECT
      SUM(cases) as totalCases,
      SUM(cured) as totalCured,
      SUM(active) as totalActive,
      SUM(deaths) as totalDeaths
     
    FROM
      district
    WHERE
      state_id= ${stateId};`;
  const bo = await db.get(getBooksQuery);
  response.send(bo);
});

//8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getBooksQuery = `
    SELECT
      state_name As stateName
    FROM
      district INNER JOIN state ON district.state_id=state.state_id
    WHERE
      district_id=${districtId};`;
  const booksArray = await db.get(getBooksQuery);
  response.send(booksArray);
});

module.exports = app;
