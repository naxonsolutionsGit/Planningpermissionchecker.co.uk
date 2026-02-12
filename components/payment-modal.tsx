"use client"

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    amount: number
    address: string
}

export default function PaymentModal({ isOpen, onClose, onSuccess, amount, address }: PaymentModalProps) {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

    const handlePayment = async () => {
        setStatus('processing')
        // Simulate API call to Stripe/Payment Gateway
        setTimeout(() => {
            setStatus('success')
            setTimeout(() => {
                onSuccess()
                onClose()
            }, 1500)
        }, 2000)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#1E7A6F]" />
                        Official Land Registry Document
                    </DialogTitle>
                    <DialogDescription>
                        A fee of £{amount} is required to retrieve the official Title Register for this property.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 border-y border-teal-50 my-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground">Property Address</span>
                        <span className="text-sm font-medium text-right max-w-[200px] truncate">{address}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Payable</span>
                        <span className="text-[#1E7A6F]">£{amount.toFixed(2)}</span>
                    </div>
                </div>

                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-4 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                        <p className="font-bold text-green-700">Payment Successful!</p>
                        <p className="text-sm text-green-600">Retrieving official document...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                            <p className="text-xs text-orange-800">
                                This fee is paid directly to HM Land Registry for the official copy of the title register.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={status === 'processing'}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePayment}
                                className="bg-[#1E7A6F] hover:bg-[#19685f]"
                                disabled={status === 'processing'}
                            >
                                {status === 'processing' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Pay £${amount.toFixed(2)} & Continue`
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
