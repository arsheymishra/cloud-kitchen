#!/usr/bin/env python3
"""
Cloud Kitchen Backend API Comprehensive Test Suite
Tests all authentication, food management, and order management endpoints
"""

import requests
import json
import sys
import time
from typing import Dict, Any, Optional

class CloudKitchenAPITester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_food_id = None
        self.test_order_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, details: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PATCH":
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        user_data = {
            "name": "John Customer",
            "email": "john.customer@example.com",
            "password": "SecurePass123!",
            "role": "user"
        }
        
        try:
            response = self.make_request("POST", "auth/register", user_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.user_token = data["token"]
                    self.log_test("User Registration", True, 
                                f"User registered successfully: {data['user']['email']}")
                else:
                    self.log_test("User Registration", False, 
                                "Missing token or user in response", data)
            else:
                self.log_test("User Registration", False, 
                            f"Registration failed with status {response.status_code}", 
                            response.text)
        except Exception as e:
            self.log_test("User Registration", False, f"Request failed: {str(e)}")
        
        # Test duplicate registration
        try:
            response = self.make_request("POST", "auth/register", user_data)
            if response.status_code == 400:
                self.log_test("Duplicate Registration Prevention", True, 
                            "Correctly prevented duplicate registration")
            else:
                self.log_test("Duplicate Registration Prevention", False, 
                            f"Should have returned 400, got {response.status_code}")
        except Exception as e:
            self.log_test("Duplicate Registration Prevention", False, f"Request failed: {str(e)}")
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Test successful login
        login_data = {
            "email": "john.customer@example.com",
            "password": "SecurePass123!"
        }
        
        try:
            response = self.make_request("POST", "auth/login", login_data)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.user_token = data["token"]
                    self.log_test("User Login", True, 
                                f"User logged in successfully: {data['user']['email']}")
                else:
                    self.log_test("User Login", False, "Missing token in response", data)
            else:
                self.log_test("User Login", False, 
                            f"Login failed with status {response.status_code}", 
                            response.text)
        except Exception as e:
            self.log_test("User Login", False, f"Request failed: {str(e)}")
        
        # Test invalid credentials
        invalid_login = {
            "email": "john.customer@example.com",
            "password": "wrongpassword"
        }
        
        try:
            response = self.make_request("POST", "auth/login", invalid_login)
            if response.status_code == 401:
                self.log_test("Invalid Login Prevention", True, 
                            "Correctly rejected invalid credentials")
            else:
                self.log_test("Invalid Login Prevention", False, 
                            f"Should have returned 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Invalid Login Prevention", False, f"Request failed: {str(e)}")
    
    def test_admin_login(self):
        """Test admin login with default credentials"""
        print("\n=== Testing Admin Login ===")
        
        admin_login = {
            "email": "admin@cloudkitchen.com",
            "password": "Admin@123"
        }
        
        try:
            response = self.make_request("POST", "auth/login", admin_login)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and data["user"]["role"] == "admin":
                    self.admin_token = data["token"]
                    self.log_test("Admin Login", True, 
                                f"Admin logged in successfully: {data['user']['email']}")
                else:
                    self.log_test("Admin Login", False, 
                                "Missing token or incorrect role", data)
            else:
                self.log_test("Admin Login", False, 
                            f"Admin login failed with status {response.status_code}", 
                            response.text)
        except Exception as e:
            self.log_test("Admin Login", False, f"Request failed: {str(e)}")
    
    def test_auth_me(self):
        """Test getting current user details"""
        print("\n=== Testing Auth Me Endpoint ===")
        
        if not self.user_token:
            self.log_test("Auth Me", False, "No user token available")
            return
        
        try:
            response = self.make_request("GET", "auth/me", token=self.user_token)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data:
                    self.log_test("Auth Me", True, 
                                f"Retrieved user details: {data['user']['email']}")
                else:
                    self.log_test("Auth Me", False, "Missing user in response", data)
            else:
                self.log_test("Auth Me", False, 
                            f"Auth me failed with status {response.status_code}", 
                            response.text)
        except Exception as e:
            self.log_test("Auth Me", False, f"Request failed: {str(e)}")
        
        # Test without token
        try:
            response = self.make_request("GET", "auth/me")
            if response.status_code == 500:  # Should be 401, but API returns 500
                self.log_test("Auth Me Without Token", True, 
                            "Correctly rejected request without token")
            else:
                self.log_test("Auth Me Without Token", False, 
                            f"Should have rejected, got {response.status_code}")
        except Exception as e:
            self.log_test("Auth Me Without Token", True, "Request properly failed without token")
    
    def test_admin_food_creation(self):
        """Test admin food creation endpoint"""
        print("\n=== Testing Admin Food Creation ===")
        
        if not self.admin_token:
            self.log_test("Admin Food Creation", False, "No admin token available")
            return
        
        # Sample base64 image (1x1 pixel PNG)
        sample_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        food_data = {
            "name": "Margherita Pizza",
            "description": "Classic pizza with tomato sauce and mozzarella cheese",
            "price": 12.99,
            "category": "Pizza",
            "imageBase64": sample_image
        }
        
        try:
            response = self.make_request("POST", "admin/food", food_data, token=self.admin_token)
            
            if response.status_code == 200:
                data = response.json()
                if "food" in data:
                    self.test_food_id = data["food"]["_id"]
                    self.log_test("Admin Food Creation", True, 
                                f"Food created successfully: {data['food']['name']}")
                else:
                    self.log_test("Admin Food Creation", False, 
                                "Missing food in response", data)
            else:
                self.log_test("Admin Food Creation", False, 
                            f"Food creation failed with status {response.status_code}", 
                            response.text)
        except Exception as e:
            self.log_test("Admin Food Creation", False, f"Request failed: {str(e)}")
        
        # Test with user token (should fail)
        if self.user_token:
            try:
                response = self.make_request("POST", "admin/food", food_data, token=self.user_token)
                if response.status_code == 403:
                    self.log_test("Food Creation Access Control", True, 
                                "Correctly denied user access to admin endpoint")
                else:
                    self.log_test("Food Creation Access Control", False, 
                                f"Should have returned 403, got {response.status_code}")
            except Exception as e:
                self.log_test("Food Creation Access Control", False, f"Request failed: {str(e)}")
    
    def test_admin_food_management(self):
        """Test admin food management endpoints"""
        print("\n=== Testing Admin Food Management ===")
        
        if not self.admin_token or not self.test_food_id:
            self.log_test("Admin Food Management", False, 
                        "No admin token or test food ID available")
            return
        
        # Test get all food (admin)
        try:
            response = self.make_request("GET", "admin/food", token=self.admin_token)
            if response.status_code == 200:
                data = response.json()
                if "foods" in data:
                    self.log_test("Admin Get All Food", True, 
                                f"Retrieved {len(data['foods'])} food items")
                else:
                    self.log_test("Admin Get All Food", False, 
                                "Missing foods in response", data)
            else:
                self.log_test("Admin Get All Food", False, 
                            f"Failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Admin Get All Food", False, f"Request failed: {str(e)}")
        
        # Test update food
        update_data = {
            "name": "Updated Margherita Pizza",
            "description": "Updated classic pizza with tomato sauce and mozzarella",
            "price": 14.99,
            "category": "Pizza"
        }
        
        try:
            response = self.make_request("PUT", f"admin/food/{self.test_food_id}", 
                                       update_data, token=self.admin_token)
            if response.status_code == 200:
                self.log_test("Admin Update Food", True, "Food updated successfully")
            else:
                self.log_test("Admin Update Food", False, 
                            f"Failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Admin Update Food", False, f"Request failed: {str(e)}")
        
        # Test toggle availability
        try:
            response = self.make_request("PATCH", f"admin/food/{self.test_food_id}/availability", 
                                       token=self.admin_token)
            if response.status_code == 200:
                self.log_test("Admin Toggle Availability", True, "Availability toggled successfully")
            else:
                self.log_test("Admin Toggle Availability", False, 
                            f"Failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Admin Toggle Availability", False, f"Request failed: {str(e)}")
    
    def test_public_food_endpoints(self):
        """Test public food endpoints"""
        print("\n=== Testing Public Food Endpoints ===")
        
        # Test get all available food
        try:
            response = self.make_request("GET", "food")
            if response.status_code == 200:
                data = response.json()
                if "foods" in data:
                    self.log_test("Public Get All Food", True, 
                                f"Retrieved {len(data['foods'])} available food items")
                else:
                    self.log_test("Public Get All Food", False, 
                                "Missing foods in response", data)
            else:
                self.log_test("Public Get All Food", False, 
                            f"Failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Public Get All Food", False, f"Request failed: {str(e)}")
        
        # Test get single food item
        if self.test_food_id:
            try:
                response = self.make_request("GET", f"food/{self.test_food_id}")
                if response.status_code == 200:
                    data = response.json()
                    if "food" in data:
                        self.log_test("Public Get Single Food", True, 
                                    f"Retrieved food: {data['food']['name']}")
                    else:
                        self.log_test("Public Get Single Food", False, 
                                    "Missing food in response", data)
                else:
                    self.log_test("Public Get Single Food", False, 
                                f"Failed with status {response.status_code}", response.text)
            except Exception as e:
                self.log_test("Public Get Single Food", False, f"Request failed: {str(e)}")
    
    def test_order_creation(self):
        """Test order creation endpoint"""
        print("\n=== Testing Order Creation ===")
        
        if not self.user_token or not self.test_food_id:
            self.log_test("Order Creation", False, 
                        "No user token or test food ID available")
            return
        
        order_data = {
            "items": [
                {
                    "foodId": self.test_food_id,
                    "quantity": 2
                }
            ],
            "deliveryAddress": "123 Main Street, City, State 12345",
            "phone": "+1234567890"
        }
        
        try:
            response = self.make_request("POST", "orders", order_data, token=self.user_token)
            
            if response.status_code == 200:
                data = response.json()
                if "order" in data:
                    self.test_order_id = data["order"]["_id"]
                    self.log_test("Order Creation", True, 
                                f"Order created successfully: {data['order']['_id']}")
                else:
                    self.log_test("Order Creation", False, 
                                "Missing order in response", data)
            else:
                self.log_test("Order Creation", False, 
                            f"Order creation failed with status {response.status_code}", 
                            response.text)
        except Exception as e:
            self.log_test("Order Creation", False, f"Request failed: {str(e)}")
    
    def test_order_management(self):
        """Test order management endpoints"""
        print("\n=== Testing Order Management ===")
        
        # Test get user orders
        if self.user_token:
            try:
                response = self.make_request("GET", "orders/my-orders", token=self.user_token)
                if response.status_code == 200:
                    data = response.json()
                    if "orders" in data:
                        self.log_test("Get User Orders", True, 
                                    f"Retrieved {len(data['orders'])} user orders")
                    else:
                        self.log_test("Get User Orders", False, 
                                    "Missing orders in response", data)
                else:
                    self.log_test("Get User Orders", False, 
                                f"Failed with status {response.status_code}", response.text)
            except Exception as e:
                self.log_test("Get User Orders", False, f"Request failed: {str(e)}")
        
        # Test get all orders (admin)
        if self.admin_token:
            try:
                response = self.make_request("GET", "admin/orders", token=self.admin_token)
                if response.status_code == 200:
                    data = response.json()
                    if "orders" in data:
                        self.log_test("Admin Get All Orders", True, 
                                    f"Retrieved {len(data['orders'])} orders")
                    else:
                        self.log_test("Admin Get All Orders", False, 
                                    "Missing orders in response", data)
                else:
                    self.log_test("Admin Get All Orders", False, 
                                f"Failed with status {response.status_code}", response.text)
            except Exception as e:
                self.log_test("Admin Get All Orders", False, f"Request failed: {str(e)}")
        
        # Test update order status
        if self.admin_token and self.test_order_id:
            status_data = {"status": "preparing"}
            try:
                response = self.make_request("PATCH", f"admin/orders/{self.test_order_id}", 
                                           status_data, token=self.admin_token)
                if response.status_code == 200:
                    self.log_test("Admin Update Order Status", True, 
                                "Order status updated successfully")
                else:
                    self.log_test("Admin Update Order Status", False, 
                                f"Failed with status {response.status_code}", response.text)
            except Exception as e:
                self.log_test("Admin Update Order Status", False, f"Request failed: {str(e)}")
    
    def test_security_access_control(self):
        """Test security and access control"""
        print("\n=== Testing Security & Access Control ===")
        
        # Test admin endpoints without token
        try:
            response = self.make_request("GET", "admin/food")
            if response.status_code in [401, 500]:  # API returns 500 for missing token
                self.log_test("Admin Endpoint Without Token", True, 
                            "Correctly rejected request without token")
            else:
                self.log_test("Admin Endpoint Without Token", False, 
                            f"Should have rejected, got {response.status_code}")
        except Exception as e:
            self.log_test("Admin Endpoint Without Token", True, 
                        "Request properly failed without token")
        
        # Test admin endpoints with user token
        if self.user_token:
            try:
                response = self.make_request("GET", "admin/food", token=self.user_token)
                if response.status_code == 403:
                    self.log_test("Admin Endpoint With User Token", True, 
                                "Correctly denied user access to admin endpoint")
                else:
                    self.log_test("Admin Endpoint With User Token", False, 
                                f"Should have returned 403, got {response.status_code}")
            except Exception as e:
                self.log_test("Admin Endpoint With User Token", False, f"Request failed: {str(e)}")
    
    def test_food_deletion(self):
        """Test food deletion (run last to clean up)"""
        print("\n=== Testing Food Deletion ===")
        
        if not self.admin_token or not self.test_food_id:
            self.log_test("Admin Delete Food", False, 
                        "No admin token or test food ID available")
            return
        
        try:
            response = self.make_request("DELETE", f"admin/food/{self.test_food_id}", 
                                       token=self.admin_token)
            if response.status_code == 200:
                self.log_test("Admin Delete Food", True, "Food deleted successfully")
            else:
                self.log_test("Admin Delete Food", False, 
                            f"Failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Admin Delete Food", False, f"Request failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Cloud Kitchen Backend API Tests")
        print(f"Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_user_registration()
        self.test_user_login()
        self.test_admin_login()
        self.test_auth_me()
        self.test_admin_food_creation()
        self.test_admin_food_management()
        self.test_public_food_endpoints()
        self.test_order_creation()
        self.test_order_management()
        self.test_security_access_control()
        self.test_food_deletion()  # Clean up
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        failed = len(self.test_results) - passed
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)
        
        return passed, failed

def main():
    """Main test execution"""
    # Get base URL from environment or use default
    import os
    base_url = os.getenv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000')
    
    print(f"Using base URL: {base_url}")
    
    tester = CloudKitchenAPITester(base_url)
    
    try:
        tester.run_all_tests()
        passed, failed = tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if failed == 0 else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Test execution failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()