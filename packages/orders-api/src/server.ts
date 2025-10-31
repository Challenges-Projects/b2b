import { app } from "./app.js";
const port = Number(process.env.PORT || 3002);
app.listen(port, () => console.log(`Orders API on :${port}`));
