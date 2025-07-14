from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from flask_login import UserMixin
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Config
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://masteruser:ASDZXC12@portfolio-dbnew.cnsu4io8otma.ap-south-1.rds.amazonaws.com:5432/portfolioapp'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'supersecretkey'  # Change in production!

db = SQLAlchemy(app)
jwt = JWTManager(app)

POLYGON_API_KEY = '8qL3vjv7pKPl5Q8U1CqUDKQN35QMvZE6'

# Models
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class Portfolio(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'))
    stock_symbol = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    buy_price = db.Column(db.Float, nullable=False)

# Error handler for better error responses
@app.errorhandler(422)
def handle_unprocessable_entity(e):
    return jsonify({"error": "Unprocessable Entity", "message": str(e)}), 422

@app.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Not Found", "message": "Endpoint not found"}), 404

# Helper function to validate required fields
def validate_required_fields(data, fields):
    for field in fields:
        if not data.get(field):
            return f"{field} is required"
    return None

# Routes
@app.route("/api/register", methods=["POST"])
def api_register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Request body must be JSON"}), 400
        
        error = validate_required_fields(data, ["username", "password"])
        if error:
            return jsonify({"msg": error}), 400

        username = str(data.get("username")).strip()
        password = str(data.get("password")).strip()
        
        if not username or not password:
            return jsonify({"msg": "Username and password cannot be empty"}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({"msg": "Username already exists"}), 400

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": "Registration successful"}), 201
    
    except Exception as e:
        return jsonify({"msg": f"Registration failed: {str(e)}"}), 500

@app.route("/api/login", methods=["POST"])
def api_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Request body must be JSON"}), 400
        
        error = validate_required_fields(data, ["username", "password"])
        if error:
            return jsonify({"msg": error}), 400

        username = str(data.get("username")).strip()
        password = str(data.get("password")).strip()
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            access_token = create_access_token(identity=user.id)
            return jsonify(access_token=access_token), 200
        else:
            return jsonify({"msg": "Invalid username or password"}), 401
    
    except Exception as e:
        return jsonify({"msg": f"Login failed: {str(e)}"}), 500

@app.route("/api/portfolio", methods=["GET"])
@jwt_required()
def get_portfolio():
    try:
        user_id = get_jwt_identity()
        holdings = Portfolio.query.filter_by(user_id=user_id).all()
        result = []
        
        for h in holdings:
            try:
                url = f"https://api.polygon.io/v2/aggs/ticker/{h.stock_symbol.upper()}/prev"
                resp = requests.get(url, params={"apiKey": POLYGON_API_KEY}, timeout=5).json()
                latest_price = resp["results"][0]["c"] if "results" in resp and resp["results"] else h.buy_price
            except:
                latest_price = h.buy_price  # Fallback to buy price if API fails
            
            result.append({
                "id": h.id,
                "symbol": h.stock_symbol,
                "quantity": h.quantity,
                "buy_price": float(h.buy_price),
                "latest_price": latest_price
            })
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": f"Failed to get portfolio: {str(e)}"}), 500

@app.route("/api/portfolio", methods=["POST"])
@jwt_required()
def add_portfolio():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({"msg": "Request body must be JSON"}), 400
        
        error = validate_required_fields(data, ["symbol", "shares", "avgPrice"])
        if error:
            return jsonify({"msg": error}), 400
        
        symbol = str(data.get("symbol")).strip().upper()
        shares = int(data.get("shares"))
        avg_price = float(data.get("avgPrice"))
        
        if not symbol:
            return jsonify({"msg": "Symbol cannot be empty"}), 400
        
        if shares <= 0:
            return jsonify({"msg": "Shares must be greater than 0"}), 400
        
        if avg_price <= 0:
            return jsonify({"msg": "Average price must be greater than 0"}), 400
        
        stock = Portfolio(
            user_id=user_id,
            stock_symbol=symbol,
            quantity=shares,
            buy_price=avg_price
        )
        db.session.add(stock)
        db.session.commit()
        return jsonify({"msg": "Stock added successfully"}), 201
    
    except ValueError as e:
        return jsonify({"msg": "Invalid number format"}), 400
    except Exception as e:
        return jsonify({"msg": f"Failed to add stock: {str(e)}"}), 500

@app.route("/api/portfolio/<int:holding_id>", methods=["DELETE"])
@jwt_required()
def delete_portfolio(holding_id):
    try:
        user_id = get_jwt_identity()
        holding = Portfolio.query.get_or_404(holding_id)
        
        if holding.user_id != user_id:
            return jsonify({"msg": "Unauthorized"}), 403
        
        db.session.delete(holding)
        db.session.commit()
        return jsonify({"msg": "Stock deleted successfully"})
    
    except Exception as e:
        return jsonify({"msg": f"Failed to delete stock: {str(e)}"}), 500

@app.route("/api/popular-stocks", methods=["GET"])
@jwt_required()
def popular_stocks():
    try:
        symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
        results = []
        
        for symbol in symbols:
            try:
                url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/prev"
                resp = requests.get(url, params={"apiKey": POLYGON_API_KEY}, timeout=5).json()
                if "results" in resp and resp["results"]:
                    price = resp["results"][0]["c"]
                    results.append({
                        "symbol": symbol,
                        "latest_price": price
                    })
            except:
                # Skip if API call fails for this symbol
                continue
        
        return jsonify(results)
    
    except Exception as e:
        return jsonify({"error": f"Failed to get popular stocks: {str(e)}"}), 500

@app.route("/api/search-stock", methods=["GET"])
@jwt_required()
def search_stock():
    try:
        symbol = request.args.get("symbol")
        if not symbol:
            return jsonify({"error": "Symbol parameter is required"}), 400

        symbol = symbol.strip().upper()
        if not symbol:
            return jsonify({"error": "Symbol cannot be empty"}), 400

        url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/prev"
        resp = requests.get(url, params={"apiKey": POLYGON_API_KEY}, timeout=5).json()
        
        if "results" in resp and resp["results"]:
            price = resp["results"][0]["c"]
            return jsonify({
                "symbol": symbol,
                "latest_price": price
            })
        else:
            return jsonify({"error": "Stock not found"}), 404
    
    except Exception as e:
        return jsonify({"error": f"Failed to search stock: {str(e)}"}), 500

@app.route("/api/stock-history", methods=["GET"])
@jwt_required()
def get_stock_history():
    try:
        symbol = request.args.get("symbol")
        if not symbol:
            return jsonify({"error": "Symbol parameter is required"}), 400
        
        symbol = symbol.strip().upper()
        if not symbol:
            return jsonify({"error": "Symbol cannot be empty"}), 400
        
        # Get last 30 days of data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/range/1/day/{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}"
        resp = requests.get(url, params={"apiKey": POLYGON_API_KEY}, timeout=10).json()
        
        if "results" in resp and resp["results"]:
            history = []
            for result in resp["results"]:
                history.append({
                    "date": result["t"],
                    "close": result["c"],
                    "open": result["o"],
                    "high": result["h"],
                    "low": result["l"],
                    "volume": result["v"]
                })
            return jsonify(history)
        else:
            return jsonify({"error": "No historical data found"}), 404
    
    except Exception as e:
        return jsonify({"error": f"Failed to get stock history: {str(e)}"}), 500

# Health check endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()}), 200

@app.route("/api/debug-token", methods=["GET"])
@jwt_required()
def debug_token():
    try:
        user_id = get_jwt_identity()
        return jsonify({"user_id": user_id, "token_valid": True})
    except Exception as e:
        return jsonify({"error": str(e), "token_valid": False}), 422

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)