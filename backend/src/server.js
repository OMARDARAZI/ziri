const app=require('./app');const {pool}=require('./config/database');const env=require('./config/environment');
async function start(){await pool.query('SELECT 1');app.listen(env.port,()=>console.log(`Zeere listening on http://localhost:${env.port}`));}start().catch((error)=>{console.error('Unable to start Zeere:',error.message);process.exit(1);});
