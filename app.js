const express = require("express");
const cors = require("cors");
const blogRoute = require("./routers/blog.route");
const userRoute = require("./routers/user.route");
const cookieParser = require("cookie-parser");
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v2/blog", blogRoute);
app.use('/api/v1/auth', userRoute)

PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`Blog server is running on port ${PORT}`);
});
