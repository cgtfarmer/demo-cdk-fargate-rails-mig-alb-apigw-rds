class CreateUsers < ActiveRecord::Migration[7.1]

  def change
    create_table :users do |t|
      t.string :first_name
      t.string :last_name
      t.integer :age
      t.float :weight
      t.boolean :smoker

      t.timestamps
    end
  end
end
