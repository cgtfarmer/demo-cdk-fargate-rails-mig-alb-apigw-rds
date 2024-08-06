class UsersController < ApplicationController

  def index
    users = User.all

    render json: users, status: 200
  end

  def show
    id = params[:id]

    user = User.find(id)

    render json: user, status: 200
  end

  def create
    user = User.create(user_params)

    render json: user, status: 201
  end

  def update
    id = params[:id]

    user = User.find_by(id: id)

    user.update(user_params)

    render json: user, status: 200
  end

  def destroy
    id = params[:id]

    user = User.find(id)

    user.destroy

    render json: { message: "ID: #{id} deleted successfully" }, status: 200
  end

  private

    def user_params
      # Example:
      # params.require(:user).permit(:firstname, :lastname, :age, :weight, :smoker)

      # Note: `require` removes the outer "user" wrapper and leaves only the internal fields
      # {
      #   "user": {
      #     "firstname": "John",
      #     "lastname": "Doe",
      #     "age": 30,
      #     "weight": 70.5,
      #     "smoker": false
      #   }
      # }

      permitted = params.permit(:firstName, :lastName, :age, :weight, :smoker)

      {
        first_name: permitted[:firstName],
        last_name: permitted[:lastName],
        age: permitted[:age],
        weight: permitted[:weight],
        smoker: permitted[:smoker],
      }
    end
end
