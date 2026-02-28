const express = require('express');
const app = express();
const port = 3000;

//Enable all CORS
const cors = require('cors');
app.use(cors());               // PHẢI đặt trước các route

//Parsing data from client
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//Import router
const productRoute = require('./routes/product.router');
app.use("/", productRoute);

const orderRoute = require('./routes/order.router');
app.use("/", orderRoute);

const orderDetailRoute = require('./routes/order_detail.router');
app.use("/", orderDetailRoute);

const categoryRoute = require('./routes/category.router');
app.use("/", categoryRoute);

const adminRoute = require('./routes/admin.router');
app.use("/", adminRoute);

const blogRoute = require('./routes/blog.router');
app.use("/", blogRoute);

const careInstructionRoute = require('./routes/care_instruction.router');
app.use("/", careInstructionRoute);

const clientRoute = require('./routes/client.router');
app.use("/", clientRoute);

const conceptRoute = require('./routes/concept.router');
app.use("/", conceptRoute);

const contactRoute = require('./routes/contact.router');
app.use("/", contactRoute);

const rankingRoute = require('./routes/ranking.router');
app.use("/", rankingRoute);

const reviewRoute = require('./routes/review.router');
app.use("/", reviewRoute);

const roomRoute = require('./routes/room.router');
app.use("/", roomRoute);

const styleRoute = require('./routes/style.router');
app.use("/", styleRoute);

const voucherRoute = require('./routes/voucher.router');
app.use("/", voucherRoute);


app.listen(port, () => {
  console.log(`My server listening on port: ${port}`);
});