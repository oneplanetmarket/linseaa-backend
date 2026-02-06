import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe"
import User from "../models/User.js"
import EcoJourney from "../models/EcoJourney.js";
import { sendOrderConfirmation, sendPaymentFailedEmail } from '../services/emailService.js';

// Helper function to update eco journey data
const updateEcoJourney = async (userId, items) => {
    try {
        // Calculate total sustainable products purchased
        let totalProducts = 0;
        let totalAmount = 0;
        
        for (const item of items) {
            const product = await Product.findById(item.product);
            if (product) {
                totalProducts += item.quantity;
                totalAmount += product.offerPrice * item.quantity;
            }
        }

        // Find or create eco journey record
        let ecoJourney = await EcoJourney.findOne({ userId });
        if (!ecoJourney) {
            ecoJourney = new EcoJourney({
                userId,
                sustainableProductsPurchased: 0,
                carbonFootprintReduced: 0,
                moneySpentOnEco: 0,
                ecoFriendlyOrders: 0,
                achievements: []
            });
        }

        // Update eco journey data
        ecoJourney.sustainableProductsPurchased += totalProducts;
        ecoJourney.carbonFootprintReduced += totalProducts * 2.5; // Assume 2.5kg CO2 saved per product
        ecoJourney.moneySpentOnEco += totalAmount;
        ecoJourney.ecoFriendlyOrders += 1;

        // Check for new achievements
        const newAchievements = [];
        if (ecoJourney.sustainableProductsPurchased >= 10 && !ecoJourney.achievements.includes('Eco Warrior')) {
            newAchievements.push('Eco Warrior');
        }
        if (ecoJourney.ecoFriendlyOrders >= 5 && !ecoJourney.achievements.includes('Green Shopper')) {
            newAchievements.push('Green Shopper');
        }
        if (ecoJourney.carbonFootprintReduced >= 50 && !ecoJourney.achievements.includes('Carbon Saver')) {
            newAchievements.push('Carbon Saver');
        }

        ecoJourney.achievements = [...ecoJourney.achievements, ...newAchievements];
        ecoJourney.lastUpdated = new Date();

        await ecoJourney.save();
        return { success: true, newAchievements };
    } catch (error) {
        console.error('Error updating eco journey:', error);
        return { success: false, error: error.message };
    }
};

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res)=>{
    try {
        const { userId, items, address } = req.body;
        if(!address || items.length === 0){
            return res.json({success: false, message: "Invalid data"})
        }
        // Calculate Amount Using Items
        let amount = await items.reduce(async (acc, item)=>{
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });

        // Update eco journey data
        await updateEcoJourney(userId, items);

        // Send order confirmation email (non-blocking)
        try {
            const user = await User.findById(userId);
            if (user) {
                await sendOrderConfirmation(user.email, {
                    name: user.name,
                    orderId: order._id,
                    amount: amount,
                    paymentMethod: "Cash on Delivery",
                    address: `${address.street}, ${address.city}, ${address.state} ${address.zipcode}`
                });
            }
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail order if email fails
        }

        return res.json({success: true, message: "Order Placed Successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res)=>{
    try {
        const { userId, items, address } = req.body;
        const {origin} = req.headers;

        if(!address || items.length === 0){
            return res.json({success: false, message: "Invalid data"})
        }

        let productData = [];

        // Calculate Amount Using Items
        let amount = await items.reduce(async (acc, item)=>{
            const product = await Product.findById(item.product);
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity,
            });
            return (await acc) + product.offerPrice * item.quantity;
        }, 0)

        // Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02);

       const order =  await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });

    // Stripe Gateway Initialize    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // create line items for stripe

     const line_items = productData.map((item)=>{
        return {
            price_data: {
                currency: "usd",
                product_data:{
                    name: item.name,
                },
                unit_amount: Math.floor(item.price + item.price * 0.02)  * 100
            },
            quantity: item.quantity,
        }
     })

     // create session
     const session = await stripeInstance.checkout.sessions.create({
        line_items,
        mode: "payment",
        success_url: `${origin}/loader?next=my-orders`,
        cancel_url: `${origin}/cart`,
        metadata: {
            orderId: order._id.toString(),
            userId,
        }
     })

        return res.json({success: true, url: session.url });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}
// Stripe Webhooks to Verify Payments Action : /stripe
export const stripeWebhooks = async (request, response)=>{
    // Stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const sig = request.headers["stripe-signature"];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        response.status(400).send(`Webhook Error: ${error.message}`)
    }

    // Handle the event
    switch (event.type) {
        case "payment_intent.succeeded":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // Getting Session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId, userId } = session.data[0].metadata;
            // Mark Payment as Paid
            await Order.findByIdAndUpdate(orderId, {isPaid: true})
            // Clear user cart
            await User.findByIdAndUpdate(userId, {cartItems: {}});
            
            // Update eco journey data for successful payment
            const order = await Order.findById(orderId);
            if (order) {
                await updateEcoJourney(userId, order.items);
                
                // Send order confirmation email for successful payment (non-blocking)
                try {
                    const user = await User.findById(userId);
                    if (user) {
                        await sendOrderConfirmation(user.email, {
                            name: user.name,
                            orderId: order._id,
                            amount: order.amount,
                            paymentMethod: "Online Payment (Stripe)",
                            address: `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipcode}`
                        });
                    }
                } catch (emailError) {
                    console.error('Failed to send order confirmation email:', emailError);
                    // Don't fail payment processing if email fails
                }
            }
            break;
        }
        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // Getting Session Metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const { orderId } = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
            
    
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }
    response.json({received: true});
}


// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res)=>{
    try {
        const { userId } = req.body;
        const orders = await Order.find({
            userId,
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


// Get All Orders ( for seller / admin) : /api/order/seller
export const getAllOrders = async (req, res)=>{
    try {
        const orders = await Order.find({
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({ success: true, orders });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Square Payment Integration - Action : /square
export const placeOrderSquare = async (req, res) => {
    try {
        const { token, userId, items, address, amount } = req.body;
        
        if (!token || !userId || !items || !address) {
            return res.json({ success: false, message: "Required fields missing" });
        }

        // Install squareup package if not installed
        const { Client, Environment } = await import("squareup");
        
        // Initialize Square client
        const client = new Client({
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            environment: process.env.SQUARE_ENVIRONMENT === "production" ? Environment.Production : Environment.Sandbox
        });

        const paymentsApi = client.paymentsApi;
        
        // Convert amount to cents for Square (Square expects amounts in the smallest currency unit)
        const amountInCents = Math.round(amount * 100);

        // Create payment request
        const paymentRequest = {
            sourceId: token,
            amountMoney: {
                amount: amountInCents,
                currency: "USD"
            },
            locationId: process.env.SQUARE_LOCATION_ID,
            idempotencyKey: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        // Process payment with Square
        const paymentResponse = await paymentsApi.createPayment(paymentRequest);

        if (paymentResponse.result.payment.status === "COMPLETED") {
            // Calculate product data for order creation
            let productData = [];
            let calculatedAmount = await items.reduce(async (acc, item) => {
                const product = await Product.findById(item.product);
                productData.push({
                    name: product.name,
                    price: product.offerPrice,
                    quantity: item.quantity,
                });
                return (await acc) + product.offerPrice * item.quantity;
            }, 0);

            // Add Tax Charge (2%)
            calculatedAmount += Math.floor(calculatedAmount * 0.02);

            // Create order in database
            const order = await Order.create({
                userId,
                items,
                amount: calculatedAmount,
                address,
                paymentType: "Square",
                paymentId: paymentResponse.result.payment.id,
                status: "paid"
            });

            // Clear user cart
            await User.findByIdAndUpdate(userId, {cartItems: {}});

            // Update users eco journey progress
            await updateEcoJourney(userId, productData);

            // Send confirmation email (non-blocking)
            try {
                const user = await User.findById(userId);
                if (user) {
                    await sendOrderConfirmation(user.email, {
                        name: user.name,
                        orderId: order._id,
                        amount: order.amount,
                        paymentMethod: "Square Payment",
                        address: `${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zipcode}`
                    });
                }
            } catch (emailError) {
                console.error("Failed to send order confirmation email:", emailError);
                // Do not fail payment processing if email fails
            }

            return res.json({ 
                success: true, 
                message: "Order placed successfully with Square payment",
                order: order,
                paymentId: paymentResponse.result.payment.id
            });
        } else {
            return res.json({ 
                success: false, 
                message: "Payment processing failed",
                details: paymentResponse.result.payment.status
            });
        }

    } catch (error) {
        console.error("Square payment error:", error);
        return res.json({ 
            success: false, 
            message: error.message || "Square payment processing failed"
        });
    }
}
