# Padilotto API Endpoints

This document outlines the direct API endpoints available in the Padilotto application.

## Authentication-Free Direct Endpoints

These endpoints don't require authentication tokens and are designed for direct access:

### Transactions

#### Get User Transactions
- **URL**: `/api/direct/transactions`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "user_id": 1
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "transactions": [
      {
        "id": 11,
        "user_id": 1,
        "amount": "0.00",
        "amount_involved": "50.00",
        "acct_balance": "1050.00",
        "time_stamp": 1747445784992,
        "trans_date": null,
        "transaction_type": "deposit",
        "status": "pending",
        "reference": null,
        "createdAt": "2025-05-17T01:36:24.000Z",
        "updatedAt": "2025-05-17T01:36:24.000Z"
      }
    ]
  }
  ```

#### Record New Transaction
- **URL**: `/api/direct/transaction`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "user_id": 1,
    "transaction_type": "deposit",
    "amount_involved": 50,
    "acct_balance": 1050,
    "time_stamp": 1747445784992,
    "trans_date": "17-5-2025"
  }
  ```
- **Valid Transaction Types**: `deposit`, `withdrawal`, `winning`, `ticket_purchase`
- **Response**:
  ```json
  {
    "success": true,
    "msg": "Transaction recorded successfully",
    "transaction_id": 11
  }
  ```

### Tickets

#### Get User Tickets
- **URL**: `/api/direct/tickets`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "user_id": 1
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "tickets": [
      {
        "id": 1,
        "ticket_id": "SL123456789",
        "user_id": 1,
        "game_id": "Simple-100",
        "mobile_no": "1234567890",
        "stake_amt": "100.00",
        "potential_winning": "500.00",
        "time_stamp": 1747445784992,
        "draw_time": "11:45 PM",
        "draw_date": "17-5-2025",
        "ticket_status": "pending",
        "created_at": "2025-05-17T01:36:24.000Z",
        "updated_at": "2025-05-17T01:36:24.000Z"
      }
    ]
  }
  ```

## Notes

1. All requests must include the `Content-Type: application/json` header.
2. The server provides appropriate validation:
   - Required fields are checked
   - Transaction types are validated
   - Database default values are used where possible
3. To test these endpoints, you can use tools like:
   - Postman
   - cURL
   - PowerShell's `Invoke-WebRequest`
   ```powershell
   $headers = @{}
   $headers.Add("Content-Type", "application/json")
   Invoke-WebRequest -Uri http://localhost:8080/api/direct/tickets -Method POST -Headers $headers -Body '{"user_id": 1}'
   ``` 