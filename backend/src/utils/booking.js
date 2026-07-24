function totalForParticipants(unitPrice, participantCount) { const price=Number(unitPrice); const count=Number(participantCount); if(!Number.isFinite(price)||price<0||!Number.isInteger(count)||count<1) throw new Error('Invalid booking price or participant count'); return price*count; }
module.exports={totalForParticipants};
