package com.example.demo.service;


import com.example.demo.entity.Payment;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;

@Service
public class InvoiceService {

 public String generateInvoice(Payment payment) {
     try {
         String filename = "Invoice_" + payment.getId() + ".pdf";
         Document document = new Document();
         PdfWriter.getInstance(document, new FileOutputStream(filename));
         document.open();

         Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
         Font normalFont = new Font(Font.HELVETICA, 12);

         document.add(new Paragraph("Insurance Payment Invoice", titleFont));
         document.add(new Paragraph(" ")); // spacing

         document.add(new Paragraph("Payment ID: " + payment.getId()));
         document.add(new Paragraph("User ID: " + payment.getUser().getId()));
         document.add(new Paragraph("User Name: " + payment.getUser().getName()));
         document.add(new Paragraph("Amount Paid: ₹" + payment.getAmount()));
         document.add(new Paragraph("Payment Date: " + payment.getPaymentDate()));
         document.add(new Paragraph("Proposal ID: " + payment.getProposal().getId()));
         document.add(new Paragraph("Vehicle Number: " + payment.getProposal().getVehicleNumber()));


         document.close();
         System.out.println("Invoice generated: " + filename);
         return filename;
     } catch (Exception e) {
         e.printStackTrace();
         return null;
     }
 }
}
