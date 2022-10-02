import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";
import { BN } from "bn.js";
import { SavingApp } from "../target/types/saving_app";

describe("saving-app", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SavingApp as Program<SavingApp>;

  let user_private_key=<SENDER_PUBKEY>.slice(0,32);
  let user_wallet = anchor.web3.Keypair.fromSeed(Uint8Array.from(user_private_key));
  // console.log(user_wallet.publicKey);
  // console.log(provider.wallet.publicKey);


  it("Create Saving!", async () => {
    
    let [pda, bump] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('bank'),
        user_wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    await program.methods.createSaving(
      "New Saving", new BN(0 * anchor.web3.LAMPORTS_PER_SOL)
    ).accounts({
      bank: pda,
      user: user_wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([user_wallet])
    .rpc();

    // let new_saving = await program.account.bank.all();

    // assert.strictEqual(new_saving.content, "New Saving");
    // assert.strictEqual(
    //   new_saving[0].account.user.toBase58(),
    //   user_wallet.publicKey.toBase58()
    // );

    // console.log(new_saving);
  });

  it("Update Saving!", async () => {
      let new_saving = await program.account.bank.all();
      
      await program.methods.updateSaving(
        new BN(1 * anchor.web3.LAMPORTS_PER_SOL),
      ).accounts({
        bank: new_saving[0].publicKey,
        user: user_wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user_wallet])
      .rpc();

    // const existing_saving = await program.account.bank.fetch(user_wallet.publicKey);

    // assert.equal(existing_saving.content, "Updated Saving");

    // existing_saving = await program.account.bank.all();
    // console.log(existing_saving);
  });
  
  it("Withdraw!", async () => {

    let data = await program.account.bank.all();

    await program.methods.withdraw().accounts({
      bank: data[0].publicKey,
      user: user_wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId
    })
    .signers([user_wallet])
    .rpc();

    // data = await program.account.bank.all();

    // console.log(data);
    // console.log(data[0].account);
    // console.log(data[0].publicKey);
    // console.log(user_wallet.publicKey);
  });

  it("Delete All Saving!", async () => {
    let data = await program.account.bank.all();
    // console.log(data);
    
    await program.methods.clear().accounts({
      bank: data[0].publicKey,
      user: user_wallet.publicKey
    })
    .signers([user_wallet])
    .rpc();
    
    data = await program.account.bank.all();
    console.log(data);

    // // let deletedSaving = await program.account.bank.fetchNullable(
    // //   user_wallet.publicKey
    // // );

    // // console.log(deletedSaving);

    // // assert.ok(deletedSaving == null);
  });
});
