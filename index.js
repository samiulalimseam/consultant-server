const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middleware

app.use(cors());
app.use(express.json())

//dbapi

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.flmxcne.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        const serviceCollection = client.db('globaldesk').collection('services');
        const reviewsCollection = client.db('globaldesk').collection('reviews');

         function verifyJWT(req,res, next){
            const authHeader = req.headers.authorization;
            if(!authHeader){
               return res.status(401).send({message: "unauthorized access"})
            }
            const token =authHeader.split(' ')[1];
            jwt.verify (token, process.env.ACCESS_TOKEN_SECRET, function(err,decoded) {
                if(err){
                    return res.status(401).send({message: "Unauth Access"});
                
                }
                req.decoded = decoded;
                next();
            })
        }

       

        app.get('/services',async (req,res)=>{
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services);
        })

        app.get('/reviews/:id',async (req,res)=>{
            const id = req.params.id;
            const query = {servId: id};
            console.log(query);
            const reviews = await reviewsCollection.find(query).toArray()
            res.send(reviews)
        })


        app.post('/addreview',async (req,res)=>{
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            console.log(result);
        })

        app.get('/service/:id',async (req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            console.log(query);
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })
        app.get('/userreviews/:email',verifyJWT,async(req,res)=>{
            const decoded = req.decoded;
            console.log('in reviews api',decoded);
            
            const userEmail = req.params.email;
            const query = {userEmail: userEmail};
            const token = req.headers;
            console.log(token);
            result = await reviewsCollection.find(query).toArray()
            res.send(result);
        })
        app.post('/publish',async (req,res)=>{
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result); 
        })
        
        app.get('/userservices/:email', async(req,res)=>{
            const user = req.params.email;
            const query = {publisher:user}
            const result = await serviceCollection.find(query).toArray()
            res.send(result);
        })
        app.post('/jwt', (req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '72h' })
            res.send({token});
        })
        app.get('/getreviews/:id', async (req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await reviewsCollection.findOne(query);
            res.send(result);
        })
        app.post('/editreview/:id',async (req,res)=>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
             const review = req.body;
             console.log(review);
             const option = {upsert: true};
             const updatedreview = {
                $set: {
                    comment: review.comment,
                    rating: parseInt(review.rating)
                }
             }
             const result = await reviewsCollection.updateOne(filter, updatedreview,option)
             console.log(review.rating);
             res.send(result);

        })

        app.post('/review/delete/:id', async (req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            console.log(id);
            const result = await reviewsCollection.deleteOne(query)
            res.send(result);


        })
        // API ENDS

        
    }




    finally{

    }
}

run().catch(error=> console.log(error));









app.listen(port,()=>{
    console.log('Server running on port',port);
})

app.get('/', (req,res)=>{
    res.send('Server Responded')
   
})