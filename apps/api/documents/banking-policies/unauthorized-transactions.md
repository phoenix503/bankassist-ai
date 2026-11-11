# Unauthorized Transaction Policy

**Policy ID:** BANK-UT-001  
**Version:** 2.0  
**Category:** CUSTOMER_PROTECTION  
**Jurisdiction:** India  
**Source Type:** RBI Regulatory Directions and NPCI Operational Guidance  
**Last Reviewed:** November 8, 2026

## 1. Overview

This policy covers transactions that customers report as unrecognized or unauthorized.

An unauthorized electronic banking transaction is a transaction that the customer has not authorized.

Examples include:

- An electronic payment the customer does not recognize.
- An unauthorized debit from a bank account.
- A card transaction the customer disputes.
- A transaction potentially resulting from compromised credentials.
- A transaction potentially resulting from a bank or third-party security breach.

An unrecognized transaction must be investigated before it is classified as fraudulent.

## 2. Regulatory References

### 2.1 RBI Customer Protection Framework

RBI has issued directions concerning customer protection and liability in unauthorized electronic banking transactions.

Relevant references include:

- RBI Circular RBI/2017-18/15, dated July 6, 2017.
- RBI Directions on Responsible Business Conduct, 2025.
- RBI Commercial Banks - Responsible Business Conduct Third Amendment Directions, 2026, dated June 24, 2026.

The 2026 amendment updates the customer protection framework for the commercial banks covered by those directions.

The applicable RBI direction depends on the category of regulated entity.

### 2.2 Customer Reporting

Customers should report unauthorized transactions to their bank immediately after noticing them.

The bank must investigate the reported transaction and determine customer liability under the applicable RBI directions.

### 2.3 NPCI UPI HELP Guidance

NPCI UPI HELP provides a customer complaint journey for eligible UPI transactions.

NPCI's guidelines also state that fraudulent transaction concerns should be reported to the customer's bank.

## 3. Investigation Requirements

### 3.1 Identify the Reported Transaction

Collect:

- Transaction reference.
- Transaction amount.
- Transaction date and timestamp.
- Debit account reference.
- Merchant or beneficiary information.
- Payment method.
- Transaction status.

### 3.2 Verify Customer Complaint

Record:

- Whether the customer recognizes the transaction.
- Whether the customer claims to have authorized it.
- When the customer first noticed the transaction.
- When the customer reported the transaction.
- Whether the customer has already contacted the bank.

### 3.3 Review Available Security Evidence

Where available and lawfully accessible, review:

- Authentication records.
- Transaction authorization records.
- Device and session information.
- Payment channel.
- Available risk and fraud alerts.
- Relevant bank or payment participant investigation findings.

Do not expose authentication secrets, PINs, passwords or OTPs in investigation logs.

### 3.4 Determine the Nature of the Complaint

Distinguish between:

- Customer does not recognize the transaction.
- Customer denies authorizing the transaction.
- Customer recognizes the transaction but disputes the amount.
- Customer reports a duplicate payment.
- Customer reports a technical payment failure.

These scenarios may require different investigation and complaint-handling procedures.

## 4. Customer Protection and Liability

Customer liability must be determined under the applicable RBI directions and the facts of the case.

The investigation must consider:

- Whether the transaction was authorized.
- Whether there was negligence or deficiency on the bank's part.
- Whether a third-party breach occurred.
- When the customer reported the transaction.
- The applicable customer liability provisions.
- Whether the customer followed the prescribed reporting process.

The applicable RBI framework places the burden of proving customer liability on the bank.

For commercial banks covered by the 2026 amendment, the updated provisions on fraudulent electronic banking transactions must be considered.

Do not apply the same liability rule indiscriminately to every category of bank or payment instrument.

## 5. Resolution Guidelines

- Do not automatically classify an unrecognized transaction as fraud.
- Encourage the customer to report the transaction immediately through the bank's official complaint channel.
- Escalate suspicious or unauthorized transaction complaints for appropriate investigation.
- Apply the applicable RBI customer protection framework.
- Verify transaction and authentication evidence.
- Record the complaint and investigation reference.
- Check the applicable bank procedure for further protective measures.
- Do not claim that a refund or compensation has been approved without supporting evidence.

## 6. Customer Communication

Customers should receive:

- An investigation or complaint reference.
- Confirmation that the complaint has been recorded.
- Information about the next steps.
- Relevant bank complaint and escalation channels.
- Updates on investigation progress.
- The resolution reason when the complaint is closed.

Customers should never be asked to disclose their UPI PIN, OTP, password or other authentication secrets.

## 7. BankAssist AI Investigation Rules

BankAssist AI must:

1. Identify the transaction reported by the customer.
2. Retrieve the available transaction details.
3. Record the customer's complaint.
4. Distinguish an unrecognized transaction from a confirmed unauthorized transaction.
5. Retrieve the relevant customer protection guidance.
6. Present available evidence.
7. Recommend appropriate escalation where required.
8. Require explicit customer confirmation before creating a mock dispute.

The AI must not:

- Declare fraud based solely on the customer's description.
- Determine customer liability independently.
- Automatically reject a complaint.
- Promise compensation or reversal without evidence.
- Reveal confidential authentication information.
- Replace the bank's formal fraud investigation or liability determination.

## 8. Evidence Requirements

Record the following where available:

- Transaction reference.
- Amount and currency.
- Transaction date and timestamp.
- Merchant or beneficiary details.
- Payment method.
- Customer complaint details.
- Customer reporting timestamp.
- Available authentication evidence.
- Available security investigation findings.
- Complaint reference.
- Relevant RBI direction reference.
- Investigation outcome and supporting evidence.

## 9. Source References

1. RBI Customer Protection - Limiting Liability of Customers in Unauthorised Electronic Banking Transactions, July 6, 2017:
   https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11040&Mode=0

2. RBI Commercial Banks - Responsible Business Conduct Third Amendment Directions, June 24, 2026:
   https://www.rbi.org.in/Scripts/BS_CircularIndexDisplay.aspx?Id=13543

3. RBI Payments Banks - Responsible Business Conduct Second Amendment Directions, June 24, 2026:
   https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13545

4. NPCI UPI HELP Guidelines, July 2023:
   https://www.npci.org.in/uploads/UPI_Help_Brand_Guidelines_86c8c28922.pdf

## 10. Scope and Limitations

This document summarizes selected RBI customer protection directions and NPCI UPI HELP operational guidance.

The applicable regulatory provisions depend on the regulated entity, payment instrument and circumstances of the transaction.

This document is intended for a demonstration banking application. It does not replace the bank's approved customer protection policy, formal fraud investigation or legal determination.
