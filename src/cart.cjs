const products=[
{id:'cuffie',name:'Cuffie Studio',category:'Tecnologia',price:8900,color:'#c6d7de',kind:'headphones',description:'Suono avvolgente e cuscinetti morbidi, per dare spazio alla tua musica.'},
{id:'zaino',name:'Zaino Quotidiano',category:'Accessori',price:5900,color:'#e0cbb5',kind:'bag',description:'Linee essenziali e tutto lo spazio che serve per la tua giornata.'},
{id:'orologio',name:'Orologio Essenziale',category:'Accessori',price:11900,color:'#cdd3c3',kind:'watch',description:'Quadrante pulito, cinturino confortevole. Il tempo, con semplicità.'},
{id:'lampada',name:'Lampada Arco',category:'Casa',price:6900,color:'#ecc9b5',kind:'lamp',description:'Una luce calda per la scrivania e i tuoi momenti di lettura.'},
{id:'speaker',name:'Altoparlante Portatile',category:'Tecnologia',price:4900,color:'#d2cadc',kind:'speaker',description:'La colonna sonora dei tuoi spazi, in un formato compatto.'},
{id:'borraccia',name:'Borraccia Termica',category:'Casa',price:2900,color:'#c5d8cc',kind:'bottle',description:'Acciaio, colori naturali e una forma da portare sempre con te.'}
];
function normalize(value){const cart={};if(!value||typeof value!=='object'||Array.isArray(value))return cart;for(const p of products){const q=value[p.id];if(Number.isInteger(q)&&q>0)cart[p.id]=Math.min(q,20);}return cart;}
function change(cart,id,quantity){const next=normalize(cart);if(!products.some(p=>p.id===id)||!Number.isInteger(quantity))return next;if(quantity<=0)delete next[id];else next[id]=Math.min(quantity,20);return next;}
function total(cart){const clean=normalize(cart);return products.reduce((sum,p)=>sum+p.price*(clean[p.id]||0),0);}
module.exports={products,normalize,change,total};
