import { useState } from "react";
import "./MpesaPayment.css";

const API_URL =
    "https://mpesa-api-1omt.vercel.app";

export default function MpesaPayment() {

    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");

    const normalizePhone = (value) => {

        let phone = value.replace(/\D/g, "");

        if (phone.startsWith("0")) {
            phone = "254" + phone.substring(1);
        }

        if (phone.startsWith("7")) {
            phone = "254" + phone;
        }

        return phone;
    };


    const validatePhone = () => {

        const normalized = normalizePhone(phone);

        return /^2547\d{8}$/.test(normalized);
    };


    const handlePhoneChange = (e) => {

        const value = e.target.value;

        if (/^[0-9+\s-]*$/.test(value)) {
            setPhone(value);
        }
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setStatus("");

        const normalizedPhone =
            normalizePhone(phone);

        if (!/^2547\d{8}$/.test(normalizedPhone)) {

            setStatus("error");
            setMessage(
                "Enter a valid Kenyan Safaricom phone number."
            );

            return;
        }


        const paymentAmount =
            Number(amount);

        if (
            !paymentAmount ||
            paymentAmount <= 0
        ) {

            setStatus("error");
            setMessage(
                "Please enter a valid amount."
            );

            return;
        }


        try {

            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/mpesa/stk/push`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phoneNumber:
                            normalizedPhone,

                        amount:
                            paymentAmount,

                        accountReference:
                            "PAYMENT",

                        transactionDesc:
                            "Customer Payment",

                        initiator:
                            "WEB_USER"

                    })
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Payment request failed"
                );
            }


            setStatus("success");

            setMessage(
                data.CustomerMessage ||
                "STK Push sent successfully. Check your phone and enter your M-Pesa PIN."
            );

        } catch (error) {

            console.error(error);

            setStatus("error");

            setMessage(
                error.message ||
                "Unable to initiate payment."
            );

        } finally {

            setLoading(false);
        }
    };


    return (

        <div className="payment-page">

            <div className="payment-card">

                <div className="payment-header">

                    <div className="mpesa-logo">
                        M-PESA
                    </div>

                    <h1>
                        Make a Payment
                    </h1>

                    <p>
                        Enter your details below
                        to initiate an M-Pesa payment.
                    </p>

                </div>


                <form
                    onSubmit={handleSubmit}
                    className="payment-form"
                >

                    <div className="form-group">

                        <label>
                            Phone Number
                        </label>

                        <div className="input-wrapper">

                            <span>
                                🇰🇪 +254
                            </span>

                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="712 345 678"
                                value={phone}
                                onChange={
                                    handlePhoneChange
                                }
                                disabled={loading}
                            />

                        </div>

                        <small>
                            Example: 0712345678
                        </small>

                    </div>


                    <div className="form-group">

                        <label>
                            Amount
                        </label>

                        <div className="amount-wrapper">

                            <span>
                                KSh
                            </span>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="0.00"
                                value={amount}
                                onChange={
                                    e =>
                                        setAmount(
                                            e.target.value
                                        )
                                }
                                disabled={loading}
                            />

                        </div>

                    </div>


                    {message && (

                        <div
                            className={`payment-message ${status}`}
                        >
                            {message}
                        </div>

                    )}


                    <button
                        type="submit"
                        className="pay-button"
                        disabled={loading}
                    >

                        {loading ? (

                            <>
                                <span className="spinner"></span>
                                Sending STK Push...
                            </>

                        ) : (

                            <>
                                Pay Now
                            </>

                        )}

                    </button>

                </form>


                <div className="secure-payment">

                    🔒 Secure M-Pesa Payment

                </div>

            </div>

        </div>
    );
}
