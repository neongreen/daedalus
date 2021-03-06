Feature: Transactions Grouping
  In order to see clearly when transactions have been executed
  As a User
  I want to see them grouped by date

  Background:
    Given I have an account
    And I have a wallet

  Scenario: Transactions are Grouped by Date
    Given I made the following transactions with my wallet:
      | title  | date       |
      | First  | 2016-01-01 |
      | Second | 2016-01-02 |
      | Third  | 2016-01-03 |
    And I am logged in
    When I am on the wallet home screen
    Then I should see the transactions grouped by their date
