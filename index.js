const express = require("express");
const cors = require("cors");
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rlqi2bh.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


app.get("/", (req, res) => {
    res.send("Server is Running")
})

async function run() {
    try {
        await client.connect();

        const db = client.db("community-cleanliness");
        const issuesCollection = db.collection("issues");
        const usersCollection = db.collection("users");
        const contributionsCollection = db.collection("contributions");


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // USERS ASIs
        app.post("/users", async (req, res) => {
            const newUser = req.body;

            const email = req.body.email;
            const query = { email: email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                res.send({ message: "User already exists" })
            } else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })

        // ISSUES APIs
        app.post("/issues", async (req, res) => {
            const issue = req.body;
            issue.date = new Date();
            const result = await issuesCollection.insertOne(issue);
            res.send(result);
        })


        app.get("/issues", async (req, res) => {
            try {
                const { email } = req.query; // optional query param
                let query = {};
                if (email) {
                    query.email = email; // filter by user email
                }
                const issues = await issuesCollection.find(query).toArray();
                res.status(200).json(issues);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Failed to fetch issues", error: error.message });
            }
        });


        app.get("/issues/:id", async (req, res) => {
            const { id } = req.params;
            try {
                const issue = await issuesCollection.findOne({ _id: new ObjectId(id) });
                if (!issue) return res.status(404).send({ message: "Issue not found" });
                res.send(issue);
            } catch (err) {
                res.status(500).send({ message: "Server error" });
            }
        });

        app.put("/issues/:id", async (req, res) => {
            const { id } = req.params;
            const updatedData = req.body;

            try {
                const result = await issuesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData }
                );
                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: "Issue not found" });
                }
                res.send({ message: "Issue updated successfully" });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to update issue" });
            }
        });

        app.delete("/issues/:id", async (req, res) => {
            const { id } = req.params;

            try {
                const result = await issuesCollection.deleteOne({ _id: new ObjectId(id) });
                if (result.deletedCount === 0) {
                    return res.status(404).send({ message: "Issue not found" });
                }
                res.send({ message: "Issue deleted successfully" });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to delete issue" });
            }
        });



        // CONTRIBUTION APIs
        app.post("/contributions", async (req, res) => {
            try {
                const contribution = req.body;
                contribution.date = new Date(); // ensure date is set
                contribution.status = "pending";
                const result = await contributionsCollection.insertOne(contribution);
                res.status(201).send(result);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to save contribution" });
            }
        });

        app.get("/contributions", async (req, res) => {
            try {
                const { issueId, email } = req.query;
                let query = {};

                if (issueId) query.issueId = issueId;
                if (email) query.email = email;

                const contributions = await contributionsCollection.find(query).toArray();
                res.status(200).send(contributions);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to fetch contributions" });
            }
        });



    }
    finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Smart Server is Running on Port: ${port}`);
})