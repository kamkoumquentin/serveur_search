var axios=  require('axios')
var express= require('express');
var cors =require('cors');
var mysql=require('mysql2');

const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

  require('dotenv').config();



const multer=require('multer');


 


  var pool= mysql.createPool({

     host :process.env.DB_HOST,
     port :process.env.DB_PORT,
     user :process.env.DB_USER,
     password: process.env.DB_PASSWORD,
   
   database :process.env.DB_NAME,
   ssl: {
    rejectUnauthorized: true, // INDISPENSABLE pour Aiven
  
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

    origin : "*",
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
               
      var y= await pool.promise().execute('insert into cours (nom,description,lien,auteur) values (?,?,?,?) ',[req.body.nom,req.body.description,req.body.lien,req.body.auteur]);
           console.dir(req.body.nom);     
         rep.status(200).json({});

              
            }catch(e){
               console.log("erreur "+e);
                 rep.status(500).json({ error: e.message });
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
 


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage permanent
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cours_uploads', // Nom du dossier sur Cloudinary
    resource_type: 'auto',   // Permet d'accepter PDF, images, etc.
  },
});

const charger = multer({ storage: storage });



  app.post('/gestion',charger.single("lien"),(req,rep)=>{

    console.log("--- Requête d'upload reçue ! ---");

 try {
        // Vérification si le fichier existe
        if (!req.file) {
            console.log("Fichier non reçu par le serveur");
            return rep.status(400).json({ error: "Aucun fichier reçu" });
        }
        else{
          // Si le fichier est là, on renvoie le chemin
        console.log("Fichier reçu :", req.file.path);
        rep.status(200).json({ path: req.file.path });
        }


    } catch (e) {
        console.error("Erreur Cloudinary ou Multer :", e);
        rep.status(500).json({ error: "Échec de l'upload vers Cloudinary" });
    }
     
   


  });





  app.listen(process.env.PORT ||8080);
