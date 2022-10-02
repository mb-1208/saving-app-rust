use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("F6z12TSKZsqDymiDGShcoLhPjcRTHBTt9B4TYv7cyEsJ");

#[program]
pub mod saving_app {
    use super::*;

    pub fn create_saving(ctx: Context<CreateSaving>, content: String, amount: u64) -> Result<()> {
        let bank = &mut ctx.accounts.bank;
        let user = &mut ctx.accounts.user;

        bank.amount = amount;
        bank.content = content;
        bank.user = *user.key;

        Ok(())
    }

    pub fn update_saving(ctx: Context<Update>, amount: u64) -> Result<()> {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer{
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.bank.to_account_info(),
            }
        );
        system_program::transfer(cpi_context, amount)?;
        let bank = &mut ctx.accounts.bank;

        bank.amount += amount;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let bank = &mut ctx.accounts.bank;
        let user = &mut ctx.accounts.user;

        if bank.user != *user.key {
            return Err(ErrorCode::InvalidOwner.into());
        }

        **bank.to_account_info().try_borrow_mut_lamports()? -= bank.amount;
        **user.to_account_info().try_borrow_mut_lamports()? += bank.amount;

        Ok(())
    }

    pub fn clear(_ctx: Context<ClearAllSaving>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateSaving<'info> {
    #[account(
        init,
        seeds = [
            b"bank".as_ref(),
            user.key.as_ref()
        ],
        bump,
        payer = user,
        space = 2000
    )]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct ClearAllSaving<'info> {
    #[account(
        mut,
        has_one = user,
        close = user
    )]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub bank: Account<'info, Bank>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>
}

#[account]
pub struct Bank {
    pub content: String,
    pub amount: u64,
    pub user: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Only the owner can withdraw")]
    InvalidOwner
}