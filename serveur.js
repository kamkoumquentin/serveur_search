var axios=  require('axios')
var express= require('express');
var cors =require('cors');
var mysql=require('mysql2');
const { Links } = require('react-router-dom');
var fs=require('fs');
const path = require('path');

  require('dotenv').config();

const multer=require('multer');


 


  var pool= mysql.createPool({

     host :process.env.DB_HOST,
     port :process.env.DB_PORT,
     user :process.env.DB_USER,
     password: process.env.DB_PASSWORD,
   
   database :process.env.DB_NAME,
   ssl: {
    rejectUnauthorized: false // INDISPENSABLE pour Aiven
  },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0

  });


  pool.getConnection((err,connection)=>{

       if(err){

        throw err;

       }

       console.log('connection reussi');
     connection.release();
     

  })


   

 var app = express();

 app.use(cors({

    origin : "http://localhost:3000",
    methods : ["GET","POST"]
 }))

 app.use(express.json());


 app.get("/affichage/",async (req,rep)=>{

        var [ligne ,_]=await pool.promise().execute("select * from cours");

           if(ligne &&  Array.isArray(ligne)){

              console.dir(ligne);
              
              rep.json(ligne);
 }
 });


 app.get("/af/:id",async (req,rep)=>{

        var [ligne ,_]=await pool.promise().execute("select * from cours where id=?",[req.params.id]);

           if(ligne &&  Array.isArray(ligne)){

              console.dir(ligne);
              
              rep.json(ligne);
             }
             else{
               console.log("erreur");
               
             }
            
           
 });


 app.get('/envoi/:id',async (req,rep)=>{
   
 var [ligne,_]= await pool.promise().execute('select *from cours where nom like ?  or auteur like ?',["%"+req.params.id+"%","%"+req.params.id+"%"]);
                   console.log("resultat obtenu");
         rep.json(ligne);
 })


 app.post('/valide_mod',async (req,rep)=>{
   
 var reoi= await pool.promise().execute('update cours set nom=?,description=? ,lien=? ,auteur=? where id = ?',[req.body.nom,req.body.description,req.body.lien,req.body.auteur,req.body.id]);
                   console.log("resultat obtenu");        
                   rep.status(200).json({
                   message: "Modification réussie"
                      });
 });



 app.post("/ajouter",async (req,rep)=>{

              try{
               
      var y=   await pool.promise().execute('insert into cours (nom,description,lien,auteur) values (?,?,?,?) ',[req.body.nom,req.body.description,req.body.lien,req.body.auteur]);
           console.dir(req.body.nom);     
         rep.status(200).json({});

              
            }catch(e){
               console.log("erreur "+e);
               
              }

 });



 app.post('/supprimer',async (req,rep)=>{

              try{
         await pool.promise().execute('delete from cours where id =? ',[req.body.id]);
              rep.status(200).json({});
              }catch(e){

               console.log("erreur "+e);
               
              }

 });



 app.use("/image",express.static(path.join(__dirname,'image')));
 

  const stockage = multer.diskStorage({

     destination : (req,rep ,cb)=>{

          cb(null,path.join(__dirname,'image'));

     },

     filename :(req,file,cb)=>{

      cb(null,file.originalname);

     }

  });

  const charger=multer({storage: stockage})




  app.post('/gestion',charger.single("lien"),(req,rep)=>{

 console.log(path.basename(req.file.path))
 console.log(req.file);

    rep.status(200).json({path:"http://localhost:8080/image/"+path.basename(req.file.path)});


  });


app.get('/telecharger/:file', (req, res) => {
  
 var lien= path.join(__dirname,"image",path.basename(req.params.file));
  res.download(lien,path.basename(req.params.file),()=>{
   
  });
});



  app.listen(process.env.PORT ||8080);