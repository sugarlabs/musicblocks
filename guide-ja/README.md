# ミュージック・ブロックスのプログラミング案内
  
ミュージック・ブロックスは子供のための音楽とコードが合体されているプログラミング環境。子供さん達はこのツールで音楽、数学、またコードの基本な色々が楽しく発見することができます。ミュージック・ブロックスはタートルブロックから作られて、ピッチとリズムのツールもあります。

タートルブロックの案内はミュージック・ブロックスより基本的なコンセプトがあります。この案内は音楽の基本があり、ミュージック・ブロックスの実例があります。

## <a name="目次"></a> 目次

1. [初めに](#初めに)
2. [音の関係](#音符)
   1. [音価のブロック](#音価)
   2. [ピッチのブロック](#ピッチ)
   3. [和音](#和音)
   4. [休符](#休符)
   5. [ドラム](#ドラム)
3. [音楽でプログラミング](#音楽でプログラミング)
   1. [チャンク](#チャンク)
   2. [音楽的の転化](#転化)
      1. [音符動きのブロック](#音符動き)
      2. [シャープ(嬰)とフラット(変)](#シャープ(嬰)とフラット(変))
      3. [移調をアジャストのブロック](#移調をアジャスト)
      4. [付点音符](#付点音符（ドット）)
      5. [演算で音価をかけ割ること](#かけることと割ること)
      6. [回繰り返し音符](#繰り返し)
      7. [スイング・リズムとタイの音符](#スイング)
      8. [音量、クレシェンド、スタッカート、スラーのブロック](#他の転化)
      9. [音程と相対的な音量の関係](#音程と相対的な音量)
      10. [絶対音程](#絶対音程)
      11. [音符転回](#転回)
      12. [逆に](#逆に)
      13. [音色と調の設定](#音色と調の設定)
      14. [ビブラート](#ビブラート)
   3. [声部](#声部)
   4. [グラフィックス](#グラフィックス)
   5. [泊](#泊)
   6. [相互作用](#相互作用)
 4. [ウィジェット](#ウィジェット)
    1. [ステータス・モニター](#ステータス)
    2. [音符のチャンクを作ること](#ピッチ・タイム行列)
       1. [ピッチ・タイム行列](#ピッチ・タイム行列) 
       2. [リズムのブロック](#リズムのブロック) 
       3. [タプルのこと](#タプルのこと)
       4. [「タプル」というのは？](#タプルとは)
       5. [Using Individual Notes in the Matrix](#INDIVIDUAL-NOTES)
    3. [リズム・ブロックでリズムを](#リズム・ブロック)
    4. [音楽の音階とモード](#音階とモード)
    5. [ピッチ・ドラム・グラフ](#ピッチ・ドラム)
    6. [音程の関係のことをピッチスライダーで発見](#ピッチの階段)
    7. [ピッチ・スライダーで何のピッチでも発見](#ピッチ・スライダー)
    8. [テンポを変えること](#テンポ)
 5. [ミュージック・ブロックスから以遠](#ミュージック・ブロックスから以遠)

この案内の中の例はコードのリンクもあります。そのすぐ楽しめるコードのリンクは`ライブで再生`と書いております。

## <a name="初めに"></a>1. 初めに
                                                     
[目次に戻す](#目次) | [次のトピック (2. 音符の音を鳴らすのに)](#音符)

ミュージック・ブロックスはブラウザーで実行するために作られています。クローム・ブラウザーで一番テストされていますがファイヤーフォックスも実行できます。[github io（ギットハーブ）](http://walterbender.github.io/musicblocks)のウェブサイトから実行でき、ミュージック・ブロックスのソース・コードもダウンロードして自分のパソコンで実行できます。

この案内よりミュージック・ブロックスの細かいを楽しみたかったら、[ミュージック・ブロックスの基本](http://github.com/walterbender/musicblocks/tree/master/documentation)をどうぞ、読んでください。
ミュージック・ブロックスの元のタートル・ブロックスの細かいを楽しみたかったら、[タートル・ブロックスの基本](http://github.com/walterbender/turtleblocksjs/tree/master/documentation)をどうぞ読んでください。

## <a name="音符"></a>
2. 音の関係 [前のトピック (1. 初めに)](#初めに) | [目次に戻す](#目次) |
[次のトピック (3. 音楽でプログラミング)](#音楽でプログラミング)

ミュージック・ブロックスは音楽の基本の色々があります。例えば、[ピッチ](#ピッチ), [リズム](#リズム・ブロック), [音量](#他の転化),[音色と声部](#声部)のツールもあります。

### <a name="音価"></a>
2.1 音価のブロック

ミュージック・ブロックスの一番基本なブロックは*音価*ブロックです。*音価*ブロックの中に[*ピッチ*ブロック](#ピッチ)が入られることができます。音価ブロックはピッチの長さがどのぐらいか決めます。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/note1.svg
 "一つの音価ブロック（上）と二つの連続的な音価ブロック（下）")

上の例に、一つの（分離した）*音価*ブロックがあります。そのブロックに1/8の数値の数字ブロックがつながっています。1/8の数値は音符の音価です。その1/8の音価と言うのは八分音符とも言います。

その下に、二つの分理的に鳴らされる音符があります。両方とも'1/8'音符で、全部で音価の合計が'1/4'音符の同じ長さです。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/note2.svg
 "八分音符、四分音符、十六分音符、半音符のも, 音価ブロックがあります。")

この例に、違う音価があります。上から、四分音符の'1/4'、十六音付の'1/16'、半音符の'1/2'です。

*音価*ブロックの数値を数字・計算のブロックでいろいろな算数ができますよ。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/charts/NotationRestChart.svg
 "音価とその音価の音価ブロックの図表です。")

上の図表を使って音価とその音価のブロックを閲覧してください。

### <a name="ピッチ"></a>
2.2 ピッチのブロック

*ピッチ*ブロックは[*音価*](#音価)ブロックの中に使われています。*ピッチ*ブロックはピッチの名前とピッチのオクターヴを決めます。ピッチの名前とオクターヴの数値を組み合わせて、音符の振動（音波の振動）を決めます。

![alt
 tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/note3.svg
 "ピッチブロックの名前とオクターヴを決める方法")

*ピッチ*の名前の選ばれるブロックが色々あります。次に例えが説明してあります。

上の*ピッチ*ブロックが*ソルフェージュ*ブロックで決められています。そのピッチ・ブロックは'ソル'と'4オクターヴ'のインプットがあります。ソルフェージュの名前が「ド、レ、ミ、ファ、ソ、ラ、シ」から選ぶことができます。

その次のピッチ・ブロックの選ばれているピッチが*ピッチ・アルファベット*ブロックで決められています。そのピッチ・ブロックのインプットは'G'と'4オクターヴ'です。ピッチ・アルファベットの名前が「C D E F G A B」から選ぶことができます。

その次のブロックが*音度*ブロックで例の選ばれている数値が音階(スケールかモード)の五度でオクターヴが４の意味です。`C == 1, D == 2, ...` (<<=== is this still correct for our newer method of scale degree??? Please check!)

その次のブロックは*ピッチ数字*ブロックでピッチが選ばれています。７のインプットで４オクターヴのC音符から７半音のピッチの意味です。ピッチ数字のゼロはどの絶対ピッチか*ピッチ数字のゼロを設定*ブロックで決めることができます。

一番下にあるブロックのピッチは*ハーツ*ブロックで決められています。ハーツ・ブロックは*数字・算数*の色々のブロックと一緒に使います。例のハーツ・ブロックの数値は`392`で音符が392ハーツのピッチで鳴らします。

ハーツを使うとオクターヴのインプットがむしします。オクターヴの数値のインプットは全数の必要があります。

ピッチの名前は*文事*ブロックでもインプットができますよ。 

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/charts/KeyboardChart.svg "音符のピッチとピアノ・キーボード図")
![alt tag](https://rawgithub.com/walterbender/musicblocks/master/charts/MalletChart.svg "音符のピッチとマレット・パーカッション（打楽器）図")
ピッチブロックはピアノ・キーボード、マレット・パーカッション、音楽譜とどういう関係あるか上の図を使ってください。

### <a name="和音"></a>2.3 和音

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/note4.svg "和音の作る方法")

和音(一つよりの一緒に鳴らされているピッチ)は一つの*音価*ブロックの中に*ピッチ*ブロックを、上の例のように、一つ以上入れます。

### <a name="休符"></a>2.4 休符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/silence.svg "休符ブロックの使い方")

休符ブロックは*音価*ブロックの中に入れるとその音価の長さで入れられているネズミが音鳴らしを休みます。

*ピッチ*ブロックを出すと自動的に休符が現れます。

### <a name="ドラム"></a>2.5 ドラム

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum1.svg "ドラム・ブロックの使える例")

*ピッチ*ブロックのも使える場合と同じでドラム・ブロックがピッチ・タイム行列か*音価*ブロックの中にも使えます。今、24個ぐらいのドラムの音の中から選ぶことができます。デフォルトのドラムがバス・ドラムです。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/note5.svg "一つよりのドラムの音を同時に")

この上の例のように[和音](#和音)一つよりの*ドラム*ブロックが一緒に使えます。一つの*音価*ブロックの中に一つよりのドラム・ブロックと*ピッチ*ブロックとお好み組み合わせて音の楽しみができます。

## <a name="音楽でプログラミング"></a>3. 音楽でプログラミング

[前のトピック (2. 音の関係)](#音符) | [目次に戻す](#目次) | [次のトピック (4. ウィジェット)](#ウィジェット)

このセクションのトピックはチャンクで*動作*ブロックを使って音楽とプログラミングができます。チャンクが自分で動作ブロックを使って作ることも、[*ピッチ・タイム行列*](#ピッチ・タイム行列)を使って作ることもできます。

### <a name="チャンク"></a>3.1 チャンク

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix4.svg "動作ブロックの使われる例")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk1.svg "チャンクがスタート・ブロックの中に使われる例")

新しい*動作*ブロックをパレットから引く時、自動的に新しいブロックが作られます。その新しいブロックが*動作*パレットの一番上に現れます。新しいブロックがパレットから引かれたブロックのコードを絶対的に読んで実行します。ですから新しいブロックのコード・スタックをクリックしても引かれたブロックをクリックしても効果が同じです。パレットから引かれるデフォールトの名前が`チャンク`,`チャンク1`,`チャンク2`…です。そのデフォールトの名前が好きに変えることができます。いくつもパレットからお好み引いて使えます。

*動作*の色々のブロックが入れられているブロックを読んで実行するためです。*動作*ブロックはいつも呼ばれた時にしか実行しません。例えば、スタート・ブロックの中にあるのが実行のボタンが押された時にしか実行しません。自分のコードと音楽を整理するためにすごく便利で約に立ちます。

*スタート*ブロックは*動作*ブロックの一つの特別な種類です。実行のボタンをクリックするとすべてのスタート・ブロックの中に入っているコードが実行されます。スタート・ブロックはプロジェクトの初めでしょうか。

自分のプロジェクトを*実行*するために、いろんな方法がありまして画面の上左の*実行*ボタンを押すと三つの実行の早さのオプションがあります。一般押すと早く実行、少し長く押すとゆっくりなペースで実行、もと長く押すと音楽はゆっくりに動く。

上の例に*チャンク*ブロックは*スタート*ブロックの中で実行のボタンを押すと*スタート*ブロックの中に入ってるコード（この例で*チャンク*ブロック）が読まれて実行します。この例のブロックを変えたかったら、*スタート*ブロックにあるものを変えるだけです。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk2.svg "一つ以上のチャンク・ブロックを使う例")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk3.svg "回繰り返すブロックを使う例")

[回繰り返す](#繰り返し)チャンクを作る方法が色々あります。一つ以上の*チャンク*ブロックを一つ一つ使うか*回繰り返す*ブロックを使う方法もあります。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk4.svg "一つ以上の動作ブロック")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk5.svg "チャンクを一緒で順を変える例")

チャンクの順も変えて効果が変えます。上の例で最初に"チャンク"を弾いて、次に"チャンク1"二回で、最後に"チャンク"をまた弾きます。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk6.svg "チャンクで音楽を作る例")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/chunk7.svg "回繰り返すブロックを使って音楽を作る例")

チャンクを組み合わせて音楽が作れます！上のメロディーご存知ですか？（ミュージック・ブロックのコードを読んでチャレンジしてみてください）

### <a name="転化"></a>3.2 音楽的の転化

ピッチとリズムを転化する方法がいっぱいあります。次に読んで、やってみましょう。

#### <a name="音符動き"></a>3.2.1 音符動きのブロック

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform0.svg " ステップピッチブロックの使える例")

*ステップピッチ*ブロックはメロディーの音符を音階的に上/下に動かすことができます。上の例に*ステップピッチ*ブロックが*回繰り返す*ブロックの中でその入ってるコードが7回繰り返して、音階の音程で音符が上に上がって、下に下ろし動きます。

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_scales.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform16.svg "Using the Consonant Step Up and Down blocks")

Another way to move up and down notes in a scale is to use the
*Consonant Step Up* and *Consonant Step Down* blocks. These blocks
calculate the number of half-steps to the next note in the current
mode. (You can read more about [音楽の音階とモード](#音階とモード) below.) Note
that the *Mouse,ピッチ,数字・算数* block returns the ピッチ number of the
most recent note played.

#### <a name="シャープ(嬰)とフラット(変)"></a>3.2.2 シャープ(嬰)とフラット(変)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform1.svg "シャープ（嬰）とフラット（変）の使える例")

♯は日本語で嬰（えい）、♭は変（へん）です。
*シャープ（嬰）*と*フラット（変）*のブロックは*ピッチ*ブロックか*音価*ブロックか[チャンク](#チャンク)を巻いてピッチを転化することができます。一つの*シャープ（嬰）*ブロックを使ってピッチが半音上で変えます。一つの*フラット（変）*ブロックを使ってピッチが半音下で変えます。左の例*ピッチ*ブロックが'ミ'で*フラット（変）*の訳でピッチが半音下変えます(ミ♭になります)。右の例、二つの*ピッチ*ブロックも（和音）が両方のピッチも半音上変えます。

#### <a name="移調をアジャスト"></a>3.2.3 移調をアジャスト

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform2.svg "移調をアジャスト")

*移調をアジャスト*ブロックは巻かされているピッチ・ブロックで選ばれているピッチを半音の数値で変えることができます。整数のインプットはピッチを高く転調し、陰性のインプットはピッチを低く転調します。インプットイは全数の必要があります。オクターヴを転調するために、12のインプットは1オクターヴ上に転調し、-12のインプットは１オクターヴ下に転調します。

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform3.svg "移調をアジャスト・ブロックで1オクターヴ上に転調する方法")

上の例にこの前の例のメロディーを転調をアジャスト・ブロックで1オクターヴに転化します。

#### <a name="付点音符（ドット）"></a>3.2.4 付点音符（ドット）

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform4.svg "付点音符（ドット）のリズムを付点音符ブロックで作る方法")

"付点音符"のリズムの音符が*付点音符*ブロックでできます。付点音符の音符はその入っている音価を50%で増します(50%で増します)。例えば、付点音符の4分音符が三つの8分音符の長さで鳴らします。計算は1/4 + 1/8＝「3/4」。付点音符の8分音符が3/16の音価で (1/8 + 1/16)鳴らします。

付点音符を使う代わりに音価の数値を変えて付点音符と同じ長さもできますよ。例えば、4分音符の符点音符の長さが欲しかったら、1/4の代わりに3/8のインプットをして4分音符の付点音符と同じ長さで鳴らします。
![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/DotsChart.svg "4分音符の付点音符の使い方です。")

#### <a name="かけることと割ること"></a>3.2.5 演算で音価をかけ割ること

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform5.svg "テンポの早さを変える方法")

You can also multiply (or divide) the beat value, which will speed up
or slowdown the notes. Multiplying the beat value of an `1/8` note by
`2` is the equivalent of playing a `1/16` note. Dividing the beat
value of an `1/8` note by '2' is the equivalent of playing a `1/4`
note.

#### <a name="繰り返し"></a>3.2.6 回繰り返し音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform6.svg "回繰り返すブロックで回数を決めます")

音符を回繰り返す方法が色々あります。*回繰り返す*ブロックははっている音符をインプットの数値で繰り返します。

*重に*ブロックは入っている音符をすべてインプットの数値で重します。

左の例に結果が`ソ, レ, ソ, ソ,レ, ソ, ソ, レ, ソ, ソ, レ, ソ`で;右の例の結果が`ソ, ソ, ソ, ソ, レ, レ, レ, レ, ソ, ソ, ソ, ソ`です。

#### <a name="スイング"></a>3.2.7 スイング・リズムとタイの音符

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform7.svg "スイング・リズムとタイ音符の方法")

*スイング*ブロック音符対ずつで使えます。その音符の対の先が音価をスイングのインプット数値で増して、対の次の音符の数値からスイング・ブロックの数値を引きます。

対の音符の音価は同じじゃないのスイング・ブロックは効果がありません。

上の例で`レ 5`は`1/6`の音価で鳴らして、`ミ 5`は`1/12`の音価で鳴らします。(`1/8 + 1/24 === 1/6` and `1/8 - 1/24 ===　1/12`)。 

対の音符の音価の合計は変わっていませんよ。

タイも音符対ずつで使えます。タイはそのタイ・ブロックの中に入っている音符の音価をすべて組み合わせてタイされている音価の合計で鳴らします。

タイ・ブロックに入っている音符のピッチは同じじゃないと効果がありません。タイ・ブロックに入っている音符の音価は違ってもOKです。

![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/TiesChart.svg "タイ・ブロックの使う方法")

#### <a name="他の転化"></a>3.2.8 音量、クレシェンド、スタッカート、スラーのブロックの関係

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform8.svg "音量を設定, クレッシェンド, スタッカート, またスラーのブロック")

*音量を設定*ブロックは音符の鳴らす音量を変えます。デフォールトが50で最低限が0(絶対静か)で最大限が100(一番大きい音量)です.

*クレッシェンド*ブロックは巻かされている音符の音量を小さく大きくします。例えば、5の数値の*クレッシェンド*ブロックに三つの音符ブロックが入っていたら、最後の音符の音量が最小の音符の音量より15%大きいです。

*スタッカート*ブロックは音符の音価を変えなく音符の鳴らす長さをスタッカートの数値で短くします。

*スラー*ブロックは音符の音価を変えなく音符の鳴らす長さをスラーの数値で長くします。音楽でレガートとも言います。

#### <a name="音程と相対的な音量"></a>3.2.9 音程と相対的な音量の関係

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform9.svg "相対的な音程ブロックと相対的な音量を設定ブロック")

*相対的な音程*は入っている音符から音程を計算してそのピッチも同時に鳴らします。例えば、音符から五度上の音も欲しかったら、このブロックを使います。上の例には、`レ`に'ラ'を`ミ`に'シ'を同時に鳴らします。

*相対的な音量を設定*ブロックは入っている音符の音量をブロックの数値で足すことか引くことをします。例えば、100の数値は現在の音量を倍にします。

#### <a name= "絶対音程"></a>絶対音程

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform14.svg "Using absolute intervals")

The *Augmented* block calculates an absolute interval, e.g., an
augmented fifth, and adds the additional ピッチ to a note. Similarly,
the *Minor* block calculates an absolute interval, e.g., a minor
third. Other absolute intervals include *Perfect*, *Diminished*, and
*Major*.

In the augmented fifth example above, a 和音 of D5 and A5 are played,
followed by a 和音 of E5 and C5. In the minor third example, which
includes a shift of one octave, first a 和音 of D5 and F5 is played,
followed by 和音 of E5 and G6.

#### <a name= "転回"></a>3.2.11 音符転回

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform13.svg "inversion")

The *Invert* block will invert a series of notes around a target
note. There are two different 音階とモード of the *Invert* block: *odd*
and *even*, the latter shifts the point of rotation up by a `1/4`
step, enabling rotation around a point between two notes.

In the *invert (even)* example, `D4` is inverted around `G4`,
resulting in a `C5`. In the *invert (odd)* example, `D4` is inverted
around a point midway between `G4` and `G♯4` resulting in a `C♯5`

#### <a name="逆に"></a>3.2.12 逆に

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform11.svg "Backward block")

The *Backward* block will play the contained notes in reverse order
(retrograde). In the example above, the notes in *チャンク* are played as
`ソ`, `Ti`, `La`, `ソ`, i.e., from the bottom to the top of the
stack.

[RUN
LIVE](http://walterbender.github.io/musicblocks/?file=MusicBlocks_crab_canon.tb)

Note that all of the blocks inside a *Backward* block are reverse, so
use this feature with caution if you include logic intermixed with
notes.

#### <a name= "音色と調の設定"></a>3.2.13 音色と調の設定

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform12.svg "setting voice and keys using Set Voice block")

The *Set Voice* block selects a [voice](#声部) for the synthesizer for any
contained blocks, e.g., violin or cello.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform10.svg "Set Key block")

The *Set Key* block will change the key and mode of the mapping
between solfege, e.g., `Do`, `レ`, `Mi`, to note names, e.g., `C`,
`D`, `E`, when in C Major. 音階とモード include Major and Minor, Chromatic,
and a number of more exotic 音階とモード, such as Bebop, Geez, Maqam, etc. 
This block allows users to access "movable Do" within Music
Blocks, where the mapping of solfege to particular ピッチ changes
depending on the user's specified tonality.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum4.svg "increasing sequence of drum beats over time")

In the above example, the sequence of [drum](#ドラム) beats is increased over time.

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_drumexample.tb)

#### <a name="ビブラート"></a>3.2.14 ビブラート

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/transform15.svg "ビブラート block")

The *ビブラート* Block adds a rapid variation in ピッチ to any contained
notes. The intensity of the variation ranges from 1 to 100 (cents),
e.g. plus or minus up to one half step. The rate argument determines
the rate of the variation.

### <a name="声部"></a>3.3 声部

Each *スタート* block runs as a separate voice in ミュージック・ブロックス. (When
you click on the 実行 button, all of the *スタート* blocks are run
concurrently.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/voices1.svg "use of voices")

If we put our song into an action...

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/voices2.svg "running the song using multiple スタート blocks")

...we can run it from multiple *スタート* blocks.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/voices3.svg "shifting the octaves up and down")

It gets more interesting if we shift up and down octaves.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/voices4.svg playing the various voices offset in time")

And even more interesting if we bring the various voices offset in time.

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_frerejacques.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/voices5.svg "queuing the various voices using events")

An alternative to use a preprogrammed delay is to use the *Broadcast*
block to bring in multiple voices. In the example above, after each
section of the song is played, a new event is broadcasted, bringing in
a new voice. Note the use of the *Mouse Sync* block. This ensures that
the multiple voices are synced to the same master clock.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum3.svg "usage of kick drum")

A special "drum" version of the *スタート* block is available for laying
down a drum track. Any *ピッチ* blocks encounted while starting from a
drum will be played as `C2` with the default drum sample. In the
example above, all of the notes in `チャンク` will be played with a kick
drum.

### <a name="グラフィックス"></a>3.4 Adding graphics

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/graphics1.svg "adding graphics")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/graphics2.svg "color range")

Turtle graphics can be combined with the music blocks. By placing
graphics blocks, e.g., *Forward* and *Right*, inside of *音価*
blocks, the graphics stay in sync with the music. In this example, the
turtle moves forward each time a quarter note is played. It turns
right during the eighth note. The ピッチ is raised by one half step,
the pen size decreases, and the pen color increases at each step in
the inner 回繰り返す loop.

[ライブで再生](https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_graphicsexample.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/graphics3.svg "synchronizing graphics and music")

Another example of graphics synchronized to the music by placing the
graphics commands inside of *音価* blocks

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_sync_graphics.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/fibonacci3.svg "usage of No-clock block")

In this example, because the computation and graphics are more
complex, a *No-clock* block is used to decouple the graphics from the
master clock. The "No-clock* block prioritizes the sequence of
actions over the specified rhythm.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/graphics4.png "リズム sequence")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/tree-example.svg "another example of the No-clock block")

Another example of embedding graphics into notes: in case, a recursive
tree drawing, where the ピッチ goes up as the branches assend.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/tree.svg "tree graphic")

[ライブで再生](https://walterbender.github.io/musicblocks/index.html?file=MusicBlocks_musicaltree.tb)

### <a name="泊"></a>3.5 泊

The beat of the music is determined by the *Meter* block (by default,
it is set to 4:4).

The *Pickup* block can be used to accommodate any notes that come in
before the beat.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/beat1.svg "meter and pickup")

Specifying beat is useful in that you can have the character of a note
vary depending upon the beat. In the example below, the 音量 of
notes on 泊 1 and 泊 3 are increased, while the 音量 of off
beats is decreased.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/beat2.svg "on-beat-do")

The *On-泊-Do* and *Off-泊-Do* blocks let you specify actions to
take on specific beats. (Note that the action is run before any blocks
inside the note block associated with the beat are run.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/graphics5.svg "using beat to synchronize graphics")

Another approach to graphics is to use modulate them based on the
beat. In the exxample above, we call the same graphics action for each
note, but the parameters associated with the action, such as pen
width, are dependent upon which beat we are on. On 泊 1, the pen
size is set to 50 and the 音量 to 75. On 泊 3, the pen size is set
to 25 and the 音量 to 50. On off beats, the pen size is set to 5 and
the volumne to 5. The resultant graphic is shown below.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/graphics6.svg "graphics modulated by beat")

### <a name="相互作用"></a>3.6 相互作用

There are many ways to interactive with ミュージック・ブロックス, including
tracking the mouse position to impact some aspect of the music.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/interactive.svg "interactions")

For example, we can launch the phrases (チャンク) interactively. When
the mouse is in the lower-left quadrant, `チャンク` is played;
lower-right quadrant, `チャンク1`; upper-left quadrant, `チャンク2`; and
upper-right quadrant, `チャンク3`.

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_interactivefrerejacques.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/interactive2.svg "creation of a two-key piano")

In the example above, a simple two-key piano is created by associating
*click* events on two different turtles with individual notes. Can you
make an 8-key piano?

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_twokey_piano.tb)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/interactive3.svg "adding randomness to your music")

You can also add a bit of randomness to your music. In the top example
above, the *One-of* block is used to randomly assign either `Do` or
`レ` each time the *音価* block is played. In the bottom example
above, the *One-of* block is used to randomly select between `チャンク1`
and `チャンク2`.

## <a name="ウィジェット"></a>ウィジェット

[前のトピック (3. 音楽でプログラミング)](#音楽でプログラミング) | [目次に戻す](#目次) | [次のトピック (5. ミュージック・ブロックスから以遠)](#ミュージック・ブロックスから以遠)

This section of the 案内 will talk about the various ウィジェット that can be added to ミュージック・ブロックス
to enhance your experience.

### <a name="ステータス"></a>4.1 ステータス

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/status1.svg "given Music block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/status2.svg "ステータス in tabular form")

The *ステータス widget* is a tool for inspecting the ステータス of Music
Blocks as it is running. By default, the key, BPM, and 音量 are
displayed. Also, each note is displayed as it is played. There is one
row per voice in the ステータス table.

Additional *Print* blocks can be added to the *ステータス* widget to
display additional music factors, e.g., 重に, transposition,
skip, [スタッカート](#他の転化), [スラー](#他の転化), and [グラフィックス](#グラフィックス) factors, e.g., x, y, heading,
color, shade, grey, and pensize.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/status3.svg "additional programming within the ステータス block")

You can do additional programming within the ステータス block. In the
example above, the 音量 is divided by 10 before being displayed.

### <a name="GENERATION"></a>4.2 Generating チャンク of Notes 

Using the ピッチ・タイム行列, it is possible to generate チャンク of notes at a much faster speed.

#### <a name="ピッチ・タイム行列"></a>4.2.1 The ピッチ・タイム行列

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix1.svg "ピッチ・タイム行列")

ミュージック・ブロックス provides a widget, the *ピッチ・タイム行列*, as a scaffold
for getting started.

Once you've launched ミュージック・ブロックス in your browser, start by clicking
on the *ピッチ・タイム行列* stack that appears in the middle of the
screen. (For the moment, ignore the *スタート* block.) You'll see a grid
organized vertically by ピッチ and horizontally by リズム.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix2.svg "ピッチ and リズム block matrix")

The matrix in the figure above has three *ピッチ* blocks and one
*リズム* block, which is used to create a 3 x 3 grid of ピッチ and
time.

Note that the default matrix has five *ピッチ* blocks, hence, you will
see five rows, one for each ピッチ. (A sixth row at the bottom is used
for specifying the リズム・ブロック associated with each note.) Also by
default, there are two *リズム* blocks, which specifies six quarter
notes followed by one half note. Since the *リズム* blocks are inside
of a *回繰り返す* block, there are fourteen (2 x 7) columns for selecting
notes.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix3.svg "matrix")

By clicking on individual cells in the grid, you should hear
individual notes (or 和音s if you click on more than one cell in a
column). In the figure, three quarter notes are selected (black
cells). First `レ 4`, followed by `Mi 4`, followed by `ソ 4`.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/play-button.svg "play button")

If you click on the *Play* button (found in the top row of the grid),
you will hear a sequence of notes played (from left to right): `レ 4`,
`Mi 4`, `ソ 4`.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/export-chunk.svg "save button")


Once you have a group of notes (a "チャンク") that you like, click on the
*Save* button (just to the right of the *Play* button). This will
create a stack of blocks that can used to play these same notes
programmatically. (More on that below.)

You can rearrange the selected notes in the grid and save other チャンク
as well.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/sort.svg "sort button")


The *Sort* button will reorder the ピッチ in the matrix from highest
to lowest and eliminate any 重に *ピッチ* blocks.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/close-button.svg "close button")


You can hide the matrix by clicking on the *Close* button (the right-most
button in the top row of the grid.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/header-icons/erase-button.svg "erase button")


There is also an Erase button that will clear the grid.

Don't worry. You can reopen the matrix at anytime (it will remember
its previous state) and since you can define as many チャンク as you
want, feel free to experiment.

Tip: You can put a チャンク inside a *ピッチ・タイム行列* block to generate
the matrix to corresponds to that チャンク.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix4.svg "usage of octave for a ピッチ")

The チャンク created when you click on the matrix is a stack of
blocks. The blocks are nested: an *動作* block contains three *Note
value* blocks, each of which contains a *ピッチ* block. The *動作*
block has a name automatically generated by the matrix, in this case,
チャンク. (You can rename the action by clicking on the name.). Each note
has a duration (in this case 4, which represents a quarter note). Try
putting different numbers in and see (hear) what happens. Each note
block also has a ピッチ block (if it were a 和音, there would be
multiple *ピッチ* blocks nested inside the Note block's clamp). Each
ピッチ block has a ピッチ name (`レ`, `Mi`, and `ソ`), and a ピッチ
octave; in this example, the octave is 4 for each ピッチ. (Try changing
the ピッチ names and the ピッチ octaves.)

To play the chuck, simply click on the action block (on the word
action). You should hear the notes play, ordered from top to bottom.

#### <a name="リズムのブロック"></a>4.2.2 リズムのブロック

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix6.svg "the リズム block")

*リズム* blocks are used to generate リズム patterns in the
*ピッチ・タイム行列* block. The top argument to the *リズム* block
is the number of notes. The bottom argument is the duration of the
note. In the top example above, three columns for quarter notes
would be generated in the matrix. In the middle example, one column
for an eighth note would be generated. In the bottom example, seven
columns for 16th notes would be generated.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix7.svg "usage of リズム block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix8.svg "resulting notes in tabular format")

You can use as many *リズム* blocks as you'd like inside the
*ピッチ・タイム行列* block. In the above example, two *リズム*
blocks are used, resulting in three quarter notes and six eighth
notes.

#### <a name="タプルのこと"></a>4.2.3 タプルのこと

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix9.svg "simple tuplet")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix10.svg "tuplet and rhythmic note values")

Tuplets are a collection of notes that get scaled to a specific
duration. Using tuplets makes it easy to create groups of notes that
are not based on a power of 2.

In the example above, three quarter notes&mdash;defined in the *Simple
Tuplet* block&mdash;are played in the time of a single quarter
note. The result is three twelfth notes. (This form, which is quite
common in music, is called a *triplet*. Other common tuplets include a
*quintuplet* and a *septuplet*.)

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix11.svg "usage of tuplet")

In the example above, the three quarter notes are defined in the
*リズム* block embedded in the *Tuplet* block. As with the *Simple
Tuplet* example, they are played in the time of a single quarter
note. The result is three twelfth notes. This more complex form allows
for intermixing multiple リズム・ブロック within single tuplet.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix12.svg "embedding リズム and Tuplet block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix13.svg "tuplet and rhythmic note values")

In the example above, the two *リズム* blocks are embedded in the
*Tuplet* block, resulting in a more complex リズム.

Note: You can mix and match *リズム* blocks and *Tuplet* blocks when
defining your matrix.

#### <a name="タプルとは"></a>4.2.4 What is a tuplet?

![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/TupletChart.svg "tuplet chart")

![alt tag](https://rawgit.com/walterbender/musicblocks/master/charts/TripletChart.svg "triplet chart")

#### <a name="INDIVIDUAL-NOTES"></a>4.2.5 Using individual notes in the matrix

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/matrix14.svg)

You can also use individual notes when defining the grid. These blocks
will expand into *リズム* blocks with the corresponding values.

### <a name="リズム・ブロック"></a>4.3 リズム・ブロックでリズムを

The *Rhythm Ruler* block is used to launch a widget similar to the
*ピッチ・タイム行列* block. The widget can be used to generate rhythmic
patterns.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm1.svg "generating リズム・ブロック")

The argument to the *Rhythm Ruler* block specifies the duration that
will be subdivided to generate a rhythmic pattern. By default, it is 1
/ 1, e.g., a whole note.

The *Set ドラム* blocks contained in the clamp of the *Rhythm Ruler*
block indicates the number of リズム・ブロック to be defined simultaneously. By
default, two リズム・ブロック are defined. The embedded *リズム* blocks define
the initial subdivision of each rhythm ruler.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm2.svg "rhythm ruler")

When the *Rhythm Ruler* block is clicked, the *Rhythm Ruler* widget is
opened. It contains a row for each リズム ruler. An input in the top
row of the widget is used to specify how many subdivisions will be
created within a cell when it is clicked. By default, 2 subdivisions
are created.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm3.svg "usage of rhythm ruler")

As shown in the above figure, the top rhythm ruler has been divided
into two half-notes and the bottom rhythm ruler has been divided into
three third-notes. Clicking on the *Play* button to the left of each row
will playback the リズム using a drum for each beat. The *Play-all*
button on the upper-left of the widget will play back all リズム・ブロック
simultaneously.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm4.svg "divide cells in rhythm ruler")

The リズム can be further subdivided by clicking in individual
cells. In the example above, two quarter-notes have been created by
clicking on one of the half-notes.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm8.svg "タイ cells in rhythm ruler")

By dragging across multiple cells, they become タイd. In the example
above, two third-notes have been タイd into one two-thirds-note.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm5.svg "save stack button")

The *Save stack* button will export リズム stacks.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm6.svg "stacks of リズム・ブロック" )

These stacks of リズム・ブロック can be used to define rhythmic patterns used
with the *ピッチ・タイム行列* block.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/rhythm7.svg "save drum machine button")

The *Save drum machine* button will export *スタート* stacks that will
play the リズム・ブロック as drum machines.

### <a name="音階とモード"></a>4.4 音楽の音階とモード

Musical 音階とモード are used to specify the relationship between [intervals](#音程と相対的な音量)
(or steps) in a scale. Since Western music is based on 12 half-steps
per octave, 音階とモード speficy how many half steps there are between each
note in a scale.

By default, ミュージック・ブロックス uses the *Major* mode, which, in the [Key](#音色と調の設定) of
C, maps to the white keys on a piano. The intervals in the *Major*
mode are `2, 2, 1, 2, 2, 2, 1`. Many other common 音階とモード are
built into ミュージック・ブロックス, including, of course, *Minor* mode, which
uses `2, 1, 2, 2, 1, 2, 2` as its intervals.

Note that not every mode uses 7 intervals per octave. For example, the
*Chromatic* mode uses 11 intervals: `1, 1, 1, 1, 1, 1, 1, 1, 1,
1, 1, 1`. The *Japanese* mode uses only 5 intervals: `1, 4,
2, 3, 2],`. What is important is that the sum of the intervals
in an octave is 12 half-steps.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/mode1.svg "mode widget")

The *Mode* widget lets you explore 音階とモード and generate custom
音階とモード. You invoke the widget with the *Custom mode* block. The mode
specified in the *Set key* block will be the default mode when the
widget launches.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/mode2.svg "launching widget with Major mode")

In the above example, the widget has been launched with *Major* mode
(the default). Note that the notes included in the mode are indicated by
the black boxes, which are arrayed in a circular pattern of tweleve
half-steps to complete the octave.

Since the intervals in the *Major* mode are `2, 2, 1, 2, 2, 2, 1`, the
notes are `0`, `2`, `4`, `5`, `7`, `9`,`11`, and `12` (one octave
above `0`).

The widget controls run along the toolbar at the top. From left to
right are:

*Play all*, which will play a scale using the current mode;

*Save*, which will save the current mode as the *Custom* mode and save
 a stack of *ピッチ* blocks that can be used with the *Pitch-time
 Matrix* block;

*Rotate counter-clockwise*, which will rotate the mode
 counter-clockwise (See the example below);

*Rotate clockwise*, which will rotate the mode clockwise (See the
 example below);

*Invert*, which will invert the mode (See the example below);

*Undo*, which will restore the mode to the previous version; and

*Close*, which will close the widget.

You can also click on individual notes to activate or deactivate them.

Note that the mode inside the *Custom mode* block is updated whenever
the mode is changed inside the widget.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/mode3.svg "creating Dorian mode")

In the above example, the *Major* mode has been rotated clockwise,
transforming it into *Dorian*.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/mode4.svg "creating Locrian mode")

In the above example, the *Major* mode has been rotated
counter-clockwise, transforming it into *Locrian*.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/mode5.svg "creating Phrygian mode")

In the above example, the *Major* mode has been inverted, transforming
it into *Phrygian*.

Note: The build-in 音階とモード in ミュージック・ブロックス can be found in [musicutils.js](https://github.com/walterbender/musicblocks/blob/master/js/musicutils.js#L68).

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/mode6.svg "ピッチ・タイム行列 block")

The *Save* button exports a stack of blocks representing the mode that
can be used inside the *ピッチ・タイム行列* block.

### <a name="ピッチ・ドラム"></a>4.5 ピッチ・ドラム・グラフ

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum2.svg "ピッチ・ドラム・グラフ")

The *Set ドラム* block is used to map the enclosed pitches into drum
sounds. ドラム sounds are played in a monopitch using the specified drum
sample. In the example above, a `kick drum` will be substitued for
each occurance of a `レ` `4`.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum8.svg "ピッチ・ドラム・グラフ 1")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum5.svg "table for ピッチ・ドラム・グラフ")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum6.svg "table for ピッチ・ドラム・グラフ")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/drum7.svg "ピッチ・ドラム・グラフ 1")

As an experience for creating mapping with the *Set ドラム* block, we
provide the *Drum-Pitch* Matrix. You use it to map between pitches and
drums. The output is a stack of *Set Dum* blocks.

### <a name="ピッチの階段"></a>4.6 音程の関係のことをピッチの階段ーで発見

The *Pitch Staircase* block is used to launch a widget similar to the
*ピッチ・タイム行列*, which can be used to generate different pitches
using a given pitch and musical proportion.

The *ピッチ* blocks contained in the clamp of the *Pitch Staircase*
block define the pitches to be initialized simultaneously. By default,
one pitch is defined and it have default note "la" and octave "3".

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchstaircase0.svg "ピッチ・スライダーで何のピッチでも発見")

When *Pitch Staircase* block is clicked, the *Pitch Staircase* widget is
initialized. The widget contains row for every *ピッチ* block contained
in the clamp of the *Pitch Staircase* block. The input fields in the top
row of the widget specify the musical proportions used to create new
pitches in the staircase. The inputs correspond to the numerator and
denominator in the proportion resectively. By default the proportion
is 3:2.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchstaircase1.svg "notes associated with the step in the ピッチの階段")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchstaircase2.svg "notes associated with the step in the ピッチの階段")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchstaircase3.svg "notes associated with the step in the ピッチの階段")

Clicking on the *Play* button to the left of each row will playback
the notes associated with that step in the ピッチの階段. The *Play-all*
button on the upper-left of the widget will play back all the pitch
steps simultaneously. A second *Play-all* button to the right of the
stair plays in increasing order of frequency first, then in 
decreasing order of frequency as well, completing a scale.

The *Save stack* button will export pitch stacks. For example, in the above 
configuration, the output  from pressing the *Save stack* button is shown below:

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchstaircase4.svg "Pitch Stair block")

These stacks can be used with the *ピッチ・タイム行列* block to define
the rows in the matrix.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchstaircase5.svg "Pitch Stair block")

### <a name="ピッチ・スライダー"></a>4.7 ピッチ・スライダーで何のピッチでも発見

The *ピッチ・スライダー* block is used to launch a widget that is used to
generate arbitray pitches. It differs from the *Pitch Staircase* widget in
that it is used to create frequencies that vary continuously within
the range of a specified octave.

Each *Sine* block contained within the clamp of the *ピッチ・スライダー* block defines the initial pitch
for an ocatve.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider0.svg "ピッチ・スライダー")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider1.svg "ピッチ・スライダー")

When the *ピッチ・スライダー* block is clicked, the *ピッチ・スライダー* widget is
initialized. The widget will have one column for each *Sine* block in
the clamp. Every column has a slider that can be used to move up or
down in frequency, continuously or in intervals of 1/12th of the
starting frequency. The mouse is used to move the frequency up and down continuously. Buttons are
used for intervals. Arrow keys can also be used to move up and down,
or between columns.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider0a.svg "ピッチ・スライダー block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider2.svg "ピッチ・スライダー")

Clicking in a column will extact the corresponding *Note* blocks, for example:

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider3.svg "ピッチ・スライダー")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider4.svg " ピッチ・スライダー block")

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/pitchslider5.svg " ピッチ・スライダー block")

### <a name="テンポ"></a>4.8 テンポを変えること

The *テンポ* block is used to launch a widget that enables the user to
visualize テンポ, defined in beats per minute (BPM). When the *テンポ* block
is clicked, the *テンポ* widget is initialized.

The *Master Beats per Minute* block contained in the clamp of the
*テンポ* block sets the initial テンポ used by the widget. This
determines the speed at which the ball in the widget moves back and
forth. If BPM is 60, then it will take one second for the ball to move
across the widget. A round-trip would take two seconds.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/tempo0.svg "テンポを変えること")

The top row of the widget holds the *Play/pause* button, the *Speed
up* and *Slow down* buttons, and an input field for updating the
テンポ.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/tempo1.svg "テンポを変えること")

You can also update the テンポ by clicking twice in spaced succession in the
widget: the new BPM is determined as the time between the two clicks. For
example, if there is 1/2 seconds between clicks, the new BPM will be set as 120.

## <a name="ミュージック・ブロックスから以遠"></a>ミュージック・ブロックスから以遠

[前のトピック (4. ウィジェット)](#ウィジェット) | [目次に戻す](#目次)

ミュージック・ブロックス is a waypoint, not a destination. One of the goals is to
point the learner towards other powerful tools. One such tool is
[Lilypond](http://lilypond.org), a music engraving program.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/lilypond1.svg "adding Save as Lilypond block")

The *Save as Lilypond* block will transcribe your composition. The
output of the program above is saved to `Downloads/hotdog.ly`. There is
also a *Save as Lilypond* button on the secondary toolbar.

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/lilypond2.svg "Save as Lilypond icon")

```
\version "2.18.2"

mouse = {
c'8 c'8 c'8 c'8 c'4 c'4 g'8 g'8 g'8 g'8 g'4 g'4 a'8 a'8 a'8 a'8 a'4
a'4 g'8 g'8 g'8 g'8 g'4 g'4 f'8 f'8 f'8 f'8 f'4 f'4 e'8 e'8 e'8 e'8
e'4 e'4 d'8 d'8 d'8 d'8 d'4 d'4 c'8 c'8 c'8 c'8 c'4 c'4
}

\score {
<<
\new Staff = "treble" {
\clef "treble"
\set Staff.instrumentName = #"mouse" \mouse
}
>>
\layout { }
}
```

![alt tag](https://rawgithub.com/walterbender/musicblocks/master/guide-ja/hotdog.png "sheet music")

[ライブで再生](http://walterbender.github.io/musicblocks/?file=MusicBlocks_hotdog.tb)
