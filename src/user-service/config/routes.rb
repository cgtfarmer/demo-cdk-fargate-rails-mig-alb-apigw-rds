Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  # get 'up' => 'rails/health#show', as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  # Example
  # ----------------------------------------
  # resources :products

  # Equivalent routes
  # ----------------------------------------
  # get '/products', to: 'products#index'
  # post '/products', to: 'products#create'
  # get '/products/new', to: 'products#new'
  # get '/products/:id', to: 'products#show'
  # get '/products/:id/edit', to: 'products#edit'
  # put '/products/:id', to: 'products#update'
  # delete '/products/:id', to: 'products#destroy'

  resources :users, only: [:index, :create, :show, :update, :destroy]

  get '/health', to: 'health#index'
end
