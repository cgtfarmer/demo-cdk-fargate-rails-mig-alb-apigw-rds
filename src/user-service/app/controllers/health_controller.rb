class HealthController < ApplicationController

  def index
    render json: { msg: 'healthy' }, status: 200
  end
end
