const User = require("../model/user");
const Conversation = require("../model/conversation");
const crypto = require('crypto');

exports.getConversations = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter vos conversations." });
	try {
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const conversations = await Conversation.find({
			$and: [
					{ $or: [{encrypted: null}, {encrypted: false}]}, 
					{ $or: [{ userId1: user._id }, { userId2: user._id }, { userId1: null }] }
				  ]
			})
				.populate("lastMessageId", "author content time")
				.populate("userId1", "username")
				.populate("userId2", "username")

		const encryptedChats = await Conversation.find({
			$and: [
					{encrypted: true}, 
					{ $or: [{ userId1: user._id }, { userId2: user._id }] }
				  ] 
			})
				.populate("lastMessageId", "author content time")
				.populate("userId1", "username")
				.populate("userId2", "username")

		// Tri des conversations par timestamp du dernier message
		// ToDo: classer en premier une conversation qui n'a pas de dernier message
		conversations.sort(function (a, b) {
			if (a.lastMessageId && b.lastMessageId) 
				return b.lastMessageId.time - a.lastMessageId.time
		});
		// Tri des conversations par timestamp du dernier message
		encryptedChats.sort(function (a, b) {
			if (a.lastMessageId && b.lastMessageId) 
				return b.lastMessageId.time - a.lastMessageId.time
		});

		res.status(200).json({ chats: conversations, encrypted: encryptedChats });

	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};

exports.newConversation = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter votre pseudo." });
	try {
		const { username2 } = req.body;
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });
		if (!user2)
			return res.status(410).json({ error: "Utilisateur non trouvé. Impossible de créer une conversation." });
		if (user.username == user2.username)
			return res.status(411).json({ error: "Vous ne pouvez pas créer une conversation avec vous même." });

		// Vérifier que la conversation n'existe pas déjà 
		const already = await Conversation.findOne(
			{
				$or: [
					{ $and: [{ userId1: user.id }, { userId2: user2.id }] },
					{ $and: [{ userId2: user.id }, { userId1: user2.id }] }
				]
			}
		)
		if (already) // ToDo: renvoyer l'ID de la conversation pour l'ouvrir (agira comme recherche)
			return res.status(411).json({ error: "Cette conversation existe déjà !", convId: already._id });

		await Conversation.create({
			userId1: user.id,
			userId2: user2.id,
			lastMessageId: null,
			encrypted: false
		});

		return res.status(200).send({status:200, userId1: user.id, userId2: user2.id});
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};

exports.isDiffieHellmanable = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter votre pseudo." });
	try {
		const { username2 } = req.body;
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });
		if (!user2)
			return res.status(410).json({ error: "Utilisateur non trouvé. Impossible de créer une conversation." });
		if (user.username == user2.username)
			return res.status(411).json({ error: "Vous ne pouvez pas créer une conversation avec vous même." });
		
		// Vérifier que la conversation n'existe pas déjà 
		const already = await Conversation.findOne(
			{
				$or: [
					{ $and: [{ userId1: user.id }, { userId2: user2.id }] },
					{ $and: [{ userId2: user.id }, { userId1: user2.id }] }
				]
			}
		)
		if (already)
			return res.status(411).json({ error: "Cette conversation existe déjà !", convId: already._id });
		
		if (!user2.status)
			return res.status(411).json({ error: "L'utilisateur doit être connecté pour engager un échange Diffie-Hellman et créer une conversation chiffrée de bout en bout." });
		
		// const p = 1301077; // ToDo : générer un nombre aléatoire
		let DH = crypto.createDiffieHellman(16); // bit length // todo : pourquoi ça marche pas avec + de bits ?
		const p = parseInt(DH.getPrime('hex'), 16);
		console.log("p:",p);

		const g = 12345;
		return res.status(200).send({status:200, 
									 user1: user.username, user2: user2.username, 
									 userId1: user.id, userId2: user2.id,
									 p: p, g: g	});
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};


exports.newEncryptedConversation = async (req, res, next) => {
	try {
		const { username2 } = req.body;
		const user = await User.findOne({ token: req.cookies.jwt });
		const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });
		
		const conv = await Conversation.create({
			userId1: user.id,
			userId2: user2.id,
			lastMessageId: null,
			encrypted: true
		});

		return res.status(200).send({status:200, userId1: user.id, userId2: user2.id, idChat: conv._id});
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};

exports.updateConversation = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "Vous devez être connecté pour consulter votre pseudo." });
	try {
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const { message } = req.body;
		const update = { lastMessageId: message._id };
		await Conversation.findOneAndUpdate({ _id: message.idchat }, update);

		return res.status(200).json({ message: "Update effectué" });
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};
