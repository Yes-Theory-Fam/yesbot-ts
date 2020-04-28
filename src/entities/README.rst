Database setup
==============

Use the following to set up the appropriate role. Change the password if you wish.

.. code-block: sql

    postgres=# create role yesbot with encrypted password 'yesbot' login;
    CREATE ROLE
    postgres=# create database yesbot owner yesbot;
    CREATE DATABASE
    postgres=#
