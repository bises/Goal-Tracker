"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const goals_1 = __importDefault(require("./routes/goals"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/goals', goals_1.default);
app.use('/api/tasks', tasks_1.default);
app.get('/health', (req, res) => {
    res.send('OK');
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
